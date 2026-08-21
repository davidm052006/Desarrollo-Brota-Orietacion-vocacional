import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';

// Mismo patrón que AdminPanel.jsx para chequear el rol propio — admin y
// moderador pueden moderar publicaciones de comunidad (ocultar/eliminar/ver
// autor real), a diferencia de useAdmin.js que solo reconoce 'admin'.
export function useModeracion() {
  const [rol, setRol] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isDemoMode = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;
    const demoLoggedIn = localStorage.getItem('demoModeLoggedIn') === 'true';

    if (isDemoMode && demoLoggedIn) {
      const demoEmail = localStorage.getItem('demoUserEmail');
      setRol(demoEmail === 'davidm20.05.2006@gmail.com' ? 'admin' : 'estudiante');
      setLoading(false);
      return;
    }

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) { setRol(null); setLoading(false); return; }

      const { data } = await supabase
        .from('perfiles_usuario')
        .select('rol')
        .eq('user_id', user.id)
        .single();

      setRol(data?.rol ?? null);
      setLoading(false);
    })();
  }, []);

  const puedeModerar = rol === 'admin' || rol === 'moderador';
  return { rol, puedeModerar, esAdmin: rol === 'admin', loading };
}
