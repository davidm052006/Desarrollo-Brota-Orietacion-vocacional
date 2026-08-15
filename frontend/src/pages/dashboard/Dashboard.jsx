import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerPerfil } from "../../services/perfilService";
import DashboardLayout from "../../components/Layout/DashboardLayout";
import ContinueSection from "./components/ContinueSection";

const FRASE_DEL_DIA = "No se trata de tener todas las respuestas, sino la curiosidad de descubrirlas.";

// ─── Hero banner ─────────────────────────────────────────────────────────────

function HeroBanner({ nombre, estado }) {
  const navigate = useNavigate();
  const testCompletado = estado === 'completado';

  const hoy = new Date();
  const fecha = hoy.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
  const fechaCap = fecha.charAt(0).toUpperCase() + fecha.slice(1);

  return (
    <div style={{
      position: 'relative', overflow: 'hidden', borderRadius: 24,
      padding: '26px 28px',
      background: 'linear-gradient(120deg, var(--primary-deep), var(--primary))',
      color: '#fff',
      boxShadow: '0 12px 30px var(--primary-glow)',
    }}>
      <div style={{ fontSize: 13, fontWeight: 600, opacity: .9 }}>
        {fechaCap} · ¡A crecer! 🌱
      </div>
      <div className="font-display" style={{ fontWeight: 800, fontSize: 30, marginTop: 6, lineHeight: 1.05 }}>
        Hola, {nombre || 'estudiante'} 👋
      </div>
      <div style={{ fontSize: 14, opacity: .92, marginTop: 8, maxWidth: 440 }}>
        Vas por buen camino. {testCompletado ? 'Tu resultado vocacional está listo.' : 'Retoma tu test vocacional y descubre tu próximo paso.'}
      </div>

      {/* Card embebida del test */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16, marginTop: 20,
        background: 'rgba(255,255,255,.14)', border: '1px solid rgba(255,255,255,.2)',
        borderRadius: 16, padding: '14px 16px', maxWidth: 520,
      }}>
        <div style={{
          width: 46, height: 46, borderRadius: 13,
          background: 'rgba(255,255,255,.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, flexShrink: 0,
        }}>🎯</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>
            Test vocacional · {testCompletado ? '100% completado' : 'Pendiente'}
          </div>
          <div style={{
            height: 7, background: 'rgba(255,255,255,.25)',
            borderRadius: 999, marginTop: 7, overflow: 'hidden',
          }}>
            <div style={{
              width: testCompletado ? '100%' : '0%',
              height: '100%', background: '#fff', borderRadius: 999,
            }} />
          </div>
        </div>
        <button
          onClick={() => navigate('/dashboard/test')}
          style={{
            background: '#fff', color: 'var(--primary-deep)',
            fontWeight: 800, fontSize: 13,
            padding: '9px 16px', borderRadius: 999,
            border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
          }}
        >
          {testCompletado ? 'Ver resultado →' : 'Realizar test →'}
        </button>
      </div>

      {/* Decorativo */}
      <svg width="150" height="150" viewBox="0 0 32 32" fill="none"
        style={{ position: 'absolute', right: -12, bottom: -26, opacity: .16, pointerEvents: 'none' }}>
        <path d="M16 31 V13" stroke="#fff" strokeWidth="2.6"/>
        <path d="M16 17 C16 9 8 6 3 6.5 C3 15 9 18 16 18 Z" fill="#fff"/>
        <path d="M16 15 C16 7 24 4 29 5 C28 14 23 17 16 17 Z" fill="#fff"/>
      </svg>
    </div>
  );
}

// ─── Quick actions ────────────────────────────────────────────────────────────

const ACTIONS = [
  { icon: '/icons/icon-profesiones.svg', title: 'Explorar profesiones',   desc: 'Carreras que se alinean contigo.',      to: '/dashboard/profesiones', tint: 'var(--primary-soft)' },
  { icon: '/icons/icon-confirmar.svg',   title: 'Realizar test vocacional', desc: 'Conoce tus intereses y fortalezas.',   to: '/dashboard/test',        tint: 'var(--accent-soft)'  },
  { icon: '/icons/icon-ruta.svg',        title: 'Rutas formativas',        desc: 'Caminos educativos para tu futuro.',   to: '/dashboard/rutas',       tint: 'var(--primary-soft)' },
  { icon: '/icons/icon-recursos.svg',    title: 'Explorar recursos',        desc: 'Guías, becas y herramientas.',         to: '/dashboard/recursos',    tint: 'var(--accent-soft)'  },
];

function QuickActions() {
  const navigate = useNavigate();

  return (
    <div>
      <div className="font-display" style={{ fontWeight: 800, fontSize: 18, marginBottom: 13 }}>
        ¿Qué te gustaría hacer hoy?
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {ACTIONS.map(({ icon, title, desc, to, tint }) => (
          <button
            key={to}
            onClick={() => navigate(to)}
            style={{
              background: 'var(--surface)', border: '1px solid var(--line)',
              borderRadius: 18, padding: 18,
              boxShadow: 'var(--shadow)',
              display: 'flex', alignItems: 'center', gap: 15,
              cursor: 'pointer', textAlign: 'left',
              transition: 'transform .18s, box-shadow .18s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 22px var(--primary-glow)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: tint,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, flexShrink: 0,
            }}><img src={icon} alt="" style={{ width: 24, height: 24 }} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14.5 }}>{title}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.35, marginTop: 2 }}>{desc}</div>
            </div>
            <div style={{ color: 'var(--primary)', fontWeight: 800, fontSize: 18 }}>→</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Sidebar de perfil ────────────────────────────────────────────────────────

function ProfileSidebar({ profile, userEmail, isAdmin }) {
  const navigate = useNavigate();

  const nombre = [profile?.nombre, profile?.apellido].filter(Boolean).join(' ') ||
                 [profile?.primer_nombre, profile?.primer_apellido].filter(Boolean).join(' ') || '—';
  const initial = nombre.charAt(0).toUpperCase();

  const diasRacha = profile?.racha_dias ?? 0;

  const card = {
    background: 'var(--surface)', border: '1px solid var(--line)',
    borderRadius: 20, padding: 20, boxShadow: 'var(--shadow)',
  };

  return (
    <aside style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Tarjeta de perfil */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
          <span style={{
            width: 52, height: 52, borderRadius: '50%',
            background: 'var(--primary)', color: 'var(--primary-ink)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 20,
          }}>{initial}</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>{nombre}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
              {userEmail ? userEmail.slice(0, 20) + (userEmail.length > 20 ? '…' : '') : ''}
            </div>
          </div>
        </div>

        {/* Barra de progreso perfil */}
        <div style={{
          height: 7, background: 'var(--surface-2)',
          borderRadius: 999, margin: '16px 0 7px', overflow: 'hidden',
        }}>
          <div style={{
            width: '45%', height: '100%',
            background: 'linear-gradient(90deg, var(--primary), var(--accent))',
            borderRadius: 999,
          }} />
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--ink-soft)' }}>
          Perfil 45% completo
          {isAdmin && (
            <span style={{
              marginLeft: 8,
              background: 'var(--primary-soft)', color: 'var(--primary-deep)',
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
            }}>Admin</span>
          )}
        </div>

        <button
          onClick={() => navigate('/dashboard/ajustes')}
          style={{
            marginTop: 14, width: '100%',
            background: 'var(--primary-soft)', color: 'var(--primary-deep)',
            textAlign: 'center', fontWeight: 700, fontSize: 13,
            padding: 11, borderRadius: 12, border: 'none', cursor: 'pointer',
          }}
        >
          Completar perfil →
        </button>
      </div>

      {/* Racha */}
      <div style={{
        background: 'linear-gradient(135deg, var(--accent), var(--primary))',
        borderRadius: 20, padding: 20, color: '#fff',
      }}>
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
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const getProfile = async () => {
      try {
        const { success, data, error: err } = await obtenerPerfil(user.id);
        if (!success) throw new Error(err);
        setProfile(data);
        setIsAdmin(data?.rol === 'admin');
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
          <HeroBanner nombre={profile?.nombre || profile?.primer_nombre} estado={null} />
          <QuickActions />
          <ContinueSection perfilUsuarioId={profile?.id} userId={user?.id} />
        </div>

        {/* Rail derecho */}
        <ProfileSidebar
          profile={profile}
          userEmail={user?.email}
          isAdmin={isAdmin}
        />

      </div>
    </DashboardLayout>
  );
}
