import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerPerfil } from "../../services/perfilService";
import DashboardLayout from "../../components/Layout/DashboardLayout";
import BannerCarousel from "./components/BannerCarousel";
import FeedReciente from "./components/FeedReciente";

const FRASE_DEL_DIA = "No se trata de tener todas las respuestas, sino la curiosidad de descubrirlas.";

// ─── Sidebar de perfil ────────────────────────────────────────────────────────

function ProfileSidebar({ profile }) {
  const navigate = useNavigate();

  const diasRacha = profile?.racha_dias ?? 0;

  return (
    <aside style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Racha */}
      <div
        onClick={() => navigate('/dashboard/racha', { state: { profile } })}
        role="button"
        tabIndex={0}
        style={{
          background: 'linear-gradient(135deg, var(--accent), var(--primary))',
          borderRadius: 20, padding: 20, color: '#fff', cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/icons/icon-racha.svg" alt="" style={{ width: 24, height: 24 }} />
          <div>
            <div className="font-display" style={{ fontWeight: 800, fontSize: 22, lineHeight: 1 }}>
              {diasRacha} días
            </div>
            <div style={{ fontSize: 12, opacity: .92 }}>de racha activa</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
          {Array.from({ length: 7 }).map((_, i) => (
            <span key={i} style={{
              flex: 1, height: 30, borderRadius: 8,
              background: i < diasRacha ? 'rgba(255,255,255,.85)' : 'rgba(255,255,255,.3)',
              border: i < diasRacha ? 'none' : '1.5px dashed rgba(255,255,255,.6)',
            }} />
          ))}
        </div>
        <div style={{ fontSize: 11.5, opacity: .92, marginTop: 10 }}>
          ¡Vuelve mañana para no perder tu racha!
        </div>
      </div>

      {/* Frase del día */}
      <div style={{
        flex: 1, background: 'var(--primary-soft)',
        border: '1px solid var(--line)', borderRadius: 20, padding: 22,
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
      }}>
        <div style={{ fontSize: 30, color: 'var(--primary)', lineHeight: 1 }}>"</div>
        <div className="font-display" style={{
          fontStyle: 'italic', fontWeight: 700, fontSize: 15,
          color: 'var(--ink)', lineHeight: 1.4, marginTop: -4,
        }}>
          {FRASE_DEL_DIA}
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 12 }}>
          Tu frase del día 🌱
        </div>
      </div>

    </aside>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function Dashboard({ user, isDemoMode = false }) {
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getProfile = async () => {
      try {
        const { success, data, error: err } = await obtenerPerfil(user.id);
        if (!success) throw new Error(err);
        setProfile(data);
      } catch (err) {
        console.error('Error al cargar perfil:', err);
        setError(err.message);
      } finally {
        setLoadingProfile(false);
      }
    };

    if (user?.id) getProfile();
  }, [user?.id]);

  if (loadingProfile) {
    return (
      <DashboardLayout isDemoMode={isDemoMode}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <p style={{ color: 'var(--ink-soft)', fontSize: 14 }} className="animate-pulse">
            Cargando tu perfil…
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout isDemoMode={isDemoMode}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--accent)', fontWeight: 600, marginBottom: 8 }}>Ocurrió un error</p>
            <p style={{ color: 'var(--ink-soft)', fontSize: 14, marginBottom: 16 }}>{error}</p>
            <button
              onClick={() => navigate('/')}
              style={{
                background: 'var(--accent)', color: '#fff',
                padding: '8px 16px', borderRadius: 999, border: 'none', cursor: 'pointer',
                fontWeight: 600, fontSize: 14,
              }}
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const profileFull = { ...profile, email: user?.email };

  return (
    <DashboardLayout profile={profileFull} isDemoMode={isDemoMode}>
      <div style={{
        maxWidth: 1180, margin: '0 auto',
        padding: '24px 28px',
        display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20,
      }}>

        {/* Columna principal */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, minWidth: 0 }}>
          <BannerCarousel perfilUsuarioId={profile?.id} userId={user?.id} />
          <FeedReciente limite={4} />
        </div>

        {/* Rail derecho */}
        <ProfileSidebar profile={profile} />

      </div>
    </DashboardLayout>
  );
}
