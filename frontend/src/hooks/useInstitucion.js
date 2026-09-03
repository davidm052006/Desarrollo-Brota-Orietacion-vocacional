import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';

// Mismo patrón que useModeracion.js/useAdmin.js — resuelve el rol propio
// consultando perfiles_usuario directo desde el cliente. `necesitaCuestionario`
// indica si la cuenta institución todavía no completó el cuestionario propio
// (institucion_contacto vacío) — se usa para forzar /dashboard/institucion
// en vez de dejarla navegar como si el perfil ya estuviera completo.
export function useInstitucion() {
  const [esInstitucion, setEsInstitucion]           = useState(false);
  const [necesitaCuestionario, setNecesitaCuestionario] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isDemoMode = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;
    const demoLoggedIn = localStorage.getItem('demoModeLoggedIn') === 'true';

    // No hay cuentas institución en modo demo — mismo criterio que useAdmin.js
    if (isDemoMode && demoLoggedIn) {
      setEsInstitucion(false);
      setLoading(false);
      return;
    }

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) { setEsInstitucion(false); setLoading(false); return; }

      const { data } = await supabase
        .from('perfiles_usuario')
        .select('rol, institucion_contacto')
        .eq('user_id', user.id)
        .single();

      setEsInstitucion(data?.rol === 'institucion');
      setNecesitaCuestionario(data?.rol === 'institucion' && !data?.institucion_contacto);
      setLoading(false);
    })();
  }, []);

  return { esInstitucion, necesitaCuestionario, loading };
}
