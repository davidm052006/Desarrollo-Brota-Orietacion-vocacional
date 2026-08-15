import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      // 1. Verificar modo demo primero
      const isDemoMode = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;
      const demoLoggedIn = localStorage.getItem('demoModeLoggedIn') === 'true';
      
      if (isDemoMode && demoLoggedIn) {
        const demoEmail = localStorage.getItem('demoUserEmail');
        const isDemoAdmin = demoEmail === 'davidm20.05.2006@gmail.com';
        setIsAdmin(isDemoAdmin);
        setLoading(false);
        return;
      }

      // 2. Modo real con Supabase
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('perfiles')
        .select('rol')
        .eq('id', user.id)
        .single();

      setIsAdmin(data?.rol === 'admin');
      setLoading(false);
    }

    checkAdmin();
  }, []);

  return { isAdmin, loading };
}