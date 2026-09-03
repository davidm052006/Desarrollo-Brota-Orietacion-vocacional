import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { supabase } from './config/supabase';
import LandingPage    from './pages/landing/LandingPage';
import Login          from './pages/landing/Login';
import Servicios      from './pages/landing/Servicios';
import SaberMas       from './pages/landing/SaberMas';
import ResetPassword  from './pages/landing/ResetPassword';
import Privacidad     from './pages/landing/Privacidad';
import Terminos       from './pages/landing/Terminos';
import Contacto       from './pages/landing/Contacto';
import Dashboard      from './pages/dashboard/Dashboard';
import TestVocacional from './pages/dashboard/test-vocacional/TestVocacional';
import DashboardLayout from './components/Layout/DashboardLayout';
import AdminPanel     from './pages/dashboard/admin/AdminPanel';
import Recursos       from './pages/dashboard/Recursos';
import Profesiones    from './pages/dashboard/Profesiones';
import Comunidad            from './pages/dashboard/Comunidad';
import ForoDetalle          from './pages/dashboard/comunidad/ForoDetalle';
import HistoriaDetalle      from './pages/dashboard/comunidad/HistoriaDetalle';
import ConvocatoriaDetalle  from './pages/dashboard/comunidad/ConvocatoriaDetalle';
import PostDetalle          from './pages/dashboard/comunidad/PostDetalle';
import AutorInfo             from './pages/dashboard/comunidad/AutorInfo';
import Ajustes              from './pages/dashboard/Ajustes';
import Perfil                from './pages/dashboard/Perfil';
import Racha                from './pages/dashboard/Racha';
import Broti                 from './pages/dashboard/Broti';
import Notificaciones       from './pages/dashboard/Notificaciones';
import Rutas                from './pages/dashboard/Rutas';

function PaginaEnConstruccion({ titulo }) {
  return (
    <DashboardLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🚧</div>
          <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--ink)' }}>{titulo}</div>
          <div style={{ fontSize: 14, color: 'var(--ink-soft)', marginTop: 4 }}>Esta sección está en construcción</div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function App() {
  const [user, setUser]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
          console.warn('⚠️ MODO DEMO: No hay keys de Supabase. Usando datos ficticios.');
          setIsDemoMode(true);
          const demoLoggedIn = localStorage.getItem('demoModeLoggedIn') === 'true';
          if (demoLoggedIn) {
            setUser({
              id: 'demo-user-123',
              email: localStorage.getItem('demoUserEmail') || 'demo@brota.com',
              user_metadata: { nombre: localStorage.getItem('demoUserName') || 'Demo User' },
            });
          } else {
            setUser(null);
          }
          setLoading(false);
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
      } catch (error) {
        console.error('Error al verificar usuario:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => { setUser(session?.user || null); }
      );
      return () => subscription?.unsubscribe();
    } catch {
      setIsDemoMode(true);
    }
  }, []);

  const puedeAcceder = user || isDemoMode;

  const spinner = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="animate-spin" style={{ width: 40, height: 40, border: '3px solid var(--line)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto' }} />
        <div style={{ marginTop: 16, fontSize: 14, color: 'var(--ink-soft)' }}>Cargando...</div>
      </div>
    </div>
  );

  return (
    <BrowserRouter>
      <Routes>
        {/* Landing page pública — se renderiza de inmediato; solo redirige si se confirma sesión */}
        <Route
          path="/"
          element={!loading && puedeAcceder ? <Navigate to="/dashboard" replace /> : <LandingPage />}
        />

        {/* Login / Auth — igual, no bloquea el render mientras se verifica la sesión */}
        <Route
          path="/login"
          element={!loading && puedeAcceder ? <Navigate to="/dashboard" replace /> : <Login isDemoMode={isDemoMode} />}
        />

        {/* Rutas públicas informativas */}
        <Route path="/servicios"      element={<Servicios />} />
        <Route path="/saber-mas"      element={<SaberMas />} />
        <Route path="/privacidad"     element={<Privacidad />} />
        <Route path="/terminos"       element={<Terminos />} />
        <Route path="/contacto"       element={<Contacto />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Rutas protegidas */}
        <Route
          path="/dashboard"
          element={loading ? spinner : puedeAcceder ? <Dashboard user={user} isDemoMode={isDemoMode} /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/dashboard/test"
          element={loading ? spinner : puedeAcceder ? <TestVocacional user={user} isDemoMode={isDemoMode} /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/dashboard/recursos"
          element={loading ? spinner : puedeAcceder ? <Recursos /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/dashboard/profesiones"
          element={loading ? spinner : puedeAcceder ? <Profesiones /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/dashboard/comunidad"
          element={loading ? spinner : puedeAcceder ? <Comunidad /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/dashboard/comunidad/foro/:id"
          element={loading ? spinner : puedeAcceder ? <ForoDetalle /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/dashboard/comunidad/historia/:id"
          element={loading ? spinner : puedeAcceder ? <HistoriaDetalle /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/dashboard/comunidad/convocatoria/:id"
          element={loading ? spinner : puedeAcceder ? <ConvocatoriaDetalle /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/dashboard/comunidad/post/:id"
          element={loading ? spinner : puedeAcceder ? <PostDetalle /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/dashboard/comunidad/autor/:userId"
          element={loading ? spinner : puedeAcceder ? <AutorInfo /> : <Navigate to="/login" replace />}
        />
        {[
          { path: '/dashboard/favoritos', titulo: 'Favoritos' },
        ].map(({ path, titulo }) => (
          <Route
            key={path}
            path={path}
            element={loading ? spinner : puedeAcceder ? <PaginaEnConstruccion titulo={titulo} /> : <Navigate to="/login" replace />}
          />
        ))}
        <Route
          path="/dashboard/rutas"
          element={loading ? spinner : puedeAcceder ? <Rutas user={user} isDemoMode={isDemoMode} /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/dashboard/notificaciones"
          element={loading ? spinner : puedeAcceder ? <Notificaciones isDemoMode={isDemoMode} /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/dashboard/ajustes"
          element={loading ? spinner : puedeAcceder ? <Ajustes user={user} isDemoMode={isDemoMode} /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/dashboard/perfil"
          element={loading ? spinner : puedeAcceder ? <Perfil user={user} isDemoMode={isDemoMode} /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/dashboard/racha"
          element={loading ? spinner : puedeAcceder ? <Racha user={user} isDemoMode={isDemoMode} /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/dashboard/broti"
          element={loading ? spinner : puedeAcceder ? <Broti user={user} isDemoMode={isDemoMode} /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/dashboard/admin"
          element={loading ? spinner : puedeAcceder ? <AdminPanel user={user} /> : <Navigate to="/login" replace />}
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Analytics />
    </BrowserRouter>
  );
}

export default App;
