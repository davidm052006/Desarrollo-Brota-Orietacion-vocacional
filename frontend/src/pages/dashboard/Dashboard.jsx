import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerPerfil, obtenerResultado } from "../../services/perfilService";
import DashboardLayout from "../../components/Layout/DashboardLayout";
import ContinueSection from "./components/ContinueSection";
import FeedReciente from "./components/FeedReciente";

const FRASE_DEL_DIA = "No se trata de tener todas las respuestas, sino la curiosidad de descubrirlas.";

// ─── Hero banner (compacto, vive en el sidebar debajo de la racha) ────────────

function HeroBannerMini({ nombre, testCompletado }) {
  const navigate = useNavigate();

  return (
    <div style={{
      borderRadius: 20, padding: 20, color: '#fff',
      background: 'linear-gradient(120deg, var(--primary-deep), var(--primary))',
      boxShadow: '0 8px 20px var(--primary-glow)',
    }}>
      <div className="font-display" style={{ fontWeight: 800, fontSize: 17, lineHeight: 1.15 }}>
        Hola, {nombre || 'estudiante'} 👋
      </div>
      <div style={{ fontSize: 12, opacity: .92, marginTop: 6 }}>
        {testCompletado ? 'Tu resultado vocacional está listo.' : 'Retomá tu test vocacional.'}
      </div>
      <button
        onClick={() => navigate('/dashboard/test')}
        style={{
          marginTop: 14, width: '100%',
          background: '#fff', color: 'var(--primary-deep)',
          fontWeight: 800, fontSize: 12.5,
          padding: '9px 0', borderRadius: 999,
          border: 'none', cursor: 'pointer',
        }}
      >
        {testCompletado ? 'Ver resultado →' : 'Realizar test →'}
      </button>
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

function ProfileSidebar({ profile, userEmail, isAdmin, testCompletado }) {
  const navigate = useNavigate();

  const nombre = [profile?.nombre, profile?.apellido].filter(Boolean).join(' ') ||
                 [profile?.primer_nombre, profile?.primer_apellido].filter(Boolean).join(' ') || '—';
  const initial = nombre.charAt(0).toUpperCase();

  const diasRacha = profile?.racha_dias ?? 0;

  // Mismos 5 campos que se pueden completar en Ajustes > Mi perfil
  const CAMPOS_PERFIL = ['nombre', 'apellido', 'ciudad', 'edad', 'nivel_educativo'];
  const camposCompletos = CAMPOS_PERFIL.filter(c => Boolean(profile?.[c])).length;
  const porcentajePerfil = Math.round((camposCompletos / CAMPOS_PERFIL.length) * 100);
  const perfilCompleto = porcentajePerfil === 100;

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
            width: `${porcentajePerfil}%`, height: '100%',
            background: 'linear-gradient(90deg, var(--primary), var(--accent))',
            borderRadius: 999, transition: 'width .3s',
          }} />
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--ink-soft)' }}>
          Perfil {porcentajePerfil}% completo
          {isAdmin && (
            <span style={{
              marginLeft: 8,
              background: 'var(--primary-soft)', color: 'var(--primary-deep)',
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
            }}>Admin</span>
          )}
        </div>

        {perfilCompleto ? (
          <div style={{
            marginTop: 14, width: '100%', boxSizing: 'border-box',
            background: 'var(--primary-soft)', color: 'var(--primary-deep)',
            textAlign: 'center', fontWeight: 700, fontSize: 13,
            padding: 11, borderRadius: 12,
          }}>
            Perfil completo
          </div>
        ) : (
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
        )}
      </div>

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

      <HeroBannerMini nombre={profile?.nombre || profile?.primer_nombre} testCompletado={testCompletado} />

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
  const [testCompletado, setTestCompletado] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const getProfile = async () => {
      try {
        const { success, data, error: err } = await obtenerPerfil(user.id);
        if (!success) throw new Error(err);
        setProfile(data);
        setIsAdmin(data?.rol === 'admin');
        if (data?.id) {
          const { success: ok, data: resultado } = await obtenerResultado(data.id);
          setTestCompletado(Boolean(ok && resultado));
        }
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
          <FeedReciente />
          <QuickActions />
          <ContinueSection perfilUsuarioId={profile?.id} userId={user?.id} />
        </div>

        {/* Rail derecho */}
        <ProfileSidebar
          profile={profile}
          userEmail={user?.email}
          isAdmin={isAdmin}
          testCompletado={testCompletado}
        />

      </div>
    </DashboardLayout>
  );
}
