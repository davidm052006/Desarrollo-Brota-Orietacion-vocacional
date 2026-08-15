// ============================================
// CONFIGURACIÓN DE SUPABASE - FRONTEND
// ============================================
// Este archivo crea y exporta el cliente de Supabase
// para que los componentes de React puedan usarlo
//
// 📱 MODO DEMO: Si no hay variables de entorno, 
// Supabase queda deshabilitado y App.jsx entra en MODO DEMO

// --------------------------------------------
// 1. IMPORTAR LA LIBRERÍA DE SUPABASE
// --------------------------------------------

// createClient: Función que crea una conexión con Supabase
import { createClient } from '@supabase/supabase-js';
// import (en lugar de require) porque el frontend usa ES Modules

// --------------------------------------------
// 2. LEER VARIABLES DE ENTORNO
// --------------------------------------------

// import.meta.env.VARIABLE_NAME lee variables del archivo .env
// En Vite, las variables DEBEN empezar con VITE_ para ser accesibles

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// Ejemplo: 'https://mebwuyegutwgimqhvjlv.supabase.co'

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
// Esta es la llave PÚBLICA (para el frontend)
// Solo tiene permisos básicos (no puede hacer operaciones de admin)

// --------------------------------------------
// 3. CREAR EL CLIENTE DE SUPABASE
// ========================================----

let supabase;

// Si tenemos ambas variables configuradas, crear cliente real
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  // Si no hay variables, crear un cliente "dummy" para modo demo
  if (import.meta.env.DEV) console.warn('📱 MODO DEMO: No hay variables de entorno de Supabase. Usando cliente deshabilitado.');

  // Cliente dummy que no hace nada pero no lanza error
  supabase = {
    auth: {
      getSession: async () => ({ data: { session: null } }),
      signInWithPassword: async () => ({ error: { message: 'Modo demo: usar el modo real' } }),
      signUp: async () => ({ data: null, error: { message: 'Modo demo: usar el modo real' } }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: (callback) => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }),
      insert: async () => ({ data: null, error: null }),
      update: async () => ({ data: null, error: null }),
    }),
  };
}

// export const permite que otros archivos importen este cliente
// Ejemplo de uso en un componente:
//   import { supabase } from './config/supabase'
export { supabase };
//   const { data } = await supabase.from('programas').select('*')

// ============================================
// RESUMEN:
// ============================================
// 
// Este archivo hace 3 cosas simples:
// 1. Lee las llaves de Supabase del archivo .env
// 2. Crea una conexión con Supabase usando esas llaves
// 3. Exporta la conexión para que los componentes la usen
//
// DIFERENCIAS CON EL BACKEND:
// - Usa import en lugar de require (ES Modules)
// - Usa import.meta.env en lugar de process.env (Vite)
// - Usa ANON_KEY en lugar de SERVICE_KEY (seguridad)
//
// ¿POR QUÉ ANON_KEY Y NO SERVICE_KEY?
// - El código del frontend se ejecuta en el navegador del usuario
// - Cualquiera puede ver el código del navegador (F12 → Sources)
// - Por eso solo usamos la llave pública (ANON_KEY)
// - La llave privada (SERVICE_KEY) solo está en el backend
//
// ANALOGÍA:
// - ANON_KEY = Llave de visitante (puede entrar pero no tocar nada importante)
// - SERVICE_KEY = Llave del dueño (puede hacer todo)
