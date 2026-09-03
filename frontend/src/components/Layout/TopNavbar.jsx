import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAdmin } from '../../hooks/useAdmin';
import { useInstitucion } from '../../hooks/useInstitucion';
import { useDarkMode } from '../../hooks/useDarkMode';
import { useFontFamily } from '../../hooks/useFontFamily';
import { useInactivityLogout } from '../../hooks/useInactivityLogout';
import { handleLogout } from '../../utils/auth';
import { getNotificaciones } from '../../services/comunidadService';
import BrotiAvatar from '../Shared/BrotiAvatar';

// Mismos 5 campos que se pueden completar en /dashboard/perfil — el % de la
// card usa estos, pero se muestran agrupados (nombre completo en una fila).
const CAMPOS_PERFIL = ['nombre', 'apellido', 'ciudad', 'edad', 'nivel_educativo'];
const DATOS_PERFIL = [
  { label: 'Nombre',          valor: (p) => [p?.nombre, p?.apellido].filter(Boolean).join(' ') || null },
  { label: 'Ciudad',          valor: (p) => p?.ciudad || null },
  { label: 'Edad',            valor: (p) => p?.edad ? `${p.edad} años` : null },
  { label: 'Nivel educativo', valor: (p) => p?.nivel_educativo || null },
];

const NAV_ITEMS = [
  { to: '/dashboard',             label: 'Inicio',         end: true },
  { to: '/dashboard/profesiones', label: 'Explorar' },
  { to: '/dashboard/test',        label: 'Test vocacional' },
  { to: '/dashboard/rutas',       label: 'Rutas' },
  { to: '/dashboard/recursos',    label: 'Recursos' },
  { to: '/dashboard/comunidad',   label: 'Comunidad' },
];

// El avatar propio siempre es Broti (nunca anónimo para uno mismo) — a
// diferencia de comunidad, acá no hace falta lógica de fallback a inicial.
function Avatar({ config }) {
  return <BrotiAvatar config={config} size={36} />;
}

export default function TopNavbar({ profile, isDemoMode = false }) {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { esInstitucion } = useInstitucion();
  const [dark, toggleDark] = useDarkMode();
  useFontFamily(); // aplica la fuente guardada en cada carga del dashboard — el selector vive en Ajustes.jsx
  const { mostrarAviso, segundosRestantes, seguirConectado, cerrarSesionAhora } = useInactivityLogout(isDemoMode);
  const navigate = useNavigate();
  const location = useLocation();

  const [perfilAbierto, setPerfilAbierto] = useState(false);
  const perfilRef = useRef(null);

  // Cerrar la card al hacer clic afuera
  useEffect(() => {
    if (!perfilAbierto) return;
    const onClickFuera = (e) => {
      if (perfilRef.current && !perfilRef.current.contains(e.target)) setPerfilAbierto(false);
    };
    document.addEventListener('mousedown', onClickFuera);
    return () => document.removeEventListener('mousedown', onClickFuera);
  }, [perfilAbierto]);

  const camposCompletos = CAMPOS_PERFIL.filter(c => Boolean(profile?.[c])).length;
  const porcentajePerfil = Math.round((camposCompletos / CAMPOS_PERFIL.length) * 100);

  // Punto rojo del ícono de notificaciones: solo si hay alguna real. No hay
  // estado leído/no-leído (ver CLAUDE.md), así que esto es "tenés algo" más
  // que "tenés algo nuevo".
  const [tieneNotificaciones, setTieneNotificaciones] = useState(false);
  useEffect(() => {
    if (isDemoMode) return;
    getNotificaciones().then(({ success, data }) => {
      if (success) setTieneNotificaciones((data ?? []).length > 0);
    });
  }, [isDemoMode]);

  const nombre = profile?.nombre || profile?.primer_nombre || '';
  const rol = isAdmin ? 'Administrador' : esInstitucion ? 'Institución' : 'Estudiante';

  const iconBtn = {
    width: 38, height: 38, borderRadius: 11,
    background: 'var(--surface-2)', border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 15, color: 'var(--ink-soft)', transition: 'opacity .15s',
  };

  return (
    <>
    {mostrarAviso && (
      <div style={{
        position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 100,
        background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16,
        boxShadow: 'var(--shadow-md)', padding: '14px 18px',
        display: 'flex', alignItems: 'center', gap: 14, maxWidth: 420,
      }}>
        <div style={{ fontSize: 13, color: 'var(--ink)' }}>
          Tu sesión se va a cerrar en <strong>{segundosRestantes}s</strong> por inactividad.
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button
            onClick={seguirConectado}
            style={{
              background: 'var(--primary)', color: 'var(--primary-ink)',
              fontWeight: 700, fontSize: 12.5, padding: '8px 14px', borderRadius: 10,
              border: 'none', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
            }}
          >
            Seguir conectado
          </button>
          <button
            onClick={cerrarSesionAhora}
            style={{
              background: 'none', color: 'var(--ink-soft)',
              fontWeight: 600, fontSize: 12.5, padding: '8px 10px', borderRadius: 10,
              border: 'none', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    )}
    <header style={{
      position: 'sticky', top: 0, zIndex: 30,
      background: 'var(--surface)', borderBottom: '1px solid var(--line)',
      height: 66, display: 'flex', alignItems: 'center',
      padding: '0 28px', gap: 22, flexShrink: 0,
    }}>

      {/* Logo — si ya estás en Comunidad, resetea el feed en lugar de ir al dashboard */}
      <NavLink
        to="/dashboard"
        onClick={e => {
          if (location.pathname === '/dashboard/comunidad') {
            e.preventDefault();
            navigate('/dashboard/comunidad', { state: { resetAt: Date.now() } });
          }
        }}
        style={{ display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0, textDecoration: 'none' }}
      >
        <img src="/logo-brota.png" alt="Brota" style={{ height: 28, width: 'auto' }} />
        <span style={{
          fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800,
          fontSize: 19, color: 'var(--ink)', letterSpacing: '-0.5px',
        }}>BROTA</span>
      </NavLink>

      {/* Nav tabs */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, overflowX: 'auto' }} className="scrollbar-none">
        {[
          ...NAV_ITEMS,
          ...(esInstitucion ? [{ to: '/dashboard/institucion', label: 'Mi institución' }] : []),
        ].map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            style={({ isActive }) => ({
              padding: '9px 15px',
              borderRadius: 11,
              fontSize: 13.5,
              fontWeight: isActive ? 700 : 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              textDecoration: 'none',
              transition: 'background .15s',
              background: isActive ? 'var(--primary)' : 'transparent',
              color: isActive ? 'var(--primary-ink)' : 'var(--ink-soft)',
            })}
          >
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Acciones derecha */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        {!adminLoading && isAdmin && (
          <NavLink
            to="/dashboard/admin"
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 15px', borderRadius: 11,
              fontSize: 13, fontWeight: 700,
              background: isActive ? 'var(--primary-deep)' : 'var(--primary)',
              color: 'var(--primary-ink)',
              textDecoration: 'none', whiteSpace: 'nowrap',
            })}
          >
            🛡️ Panel Admin
          </NavLink>
        )}

        <button
          onClick={() => navigate('/dashboard/favoritos')}
          title="Favoritos"
          style={iconBtn}
        ><img src="/icons/icon-favoritos.svg" alt="Favoritos" style={{ width: 18, height: 18 }} /></button>

        <div style={{ position: 'relative' }}>
          <button
            onClick={() => navigate('/dashboard/notificaciones')}
            title="Notificaciones"
            style={iconBtn}
          ><img src="/icons/icon-mensajes.svg" alt="Notificaciones" style={{ width: 18, height: 18 }} /></button>
          {tieneNotificaciones && (
            <span style={{
              position: 'absolute', top: 6, right: 6,
              width: 7, height: 7, borderRadius: '50%',
              background: 'var(--accent)',
            }} />
          )}
        </div>

        <button
          onClick={toggleDark}
          title={dark ? 'Modo claro' : 'Modo oscuro'}
          style={{ ...iconBtn, background: 'var(--accent-soft)', color: 'var(--accent)' }}
        >
          {dark ? '☀️' : '🌙'}
        </button>

        <button
          onClick={() => navigate('/dashboard/ajustes')}
          title="Configuración"
          style={iconBtn}
        ><img src="/icons/icon-ajustes.svg" alt="Configuración" style={{ width: 18, height: 18 }} /></button>

        <div style={{ width: 1, height: 26, background: 'var(--line)', margin: '0 2px' }} />

        <div ref={perfilRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setPerfilAbierto(o => !o)}
            style={{
              display: 'flex', alignItems: 'center', gap: 9,
              cursor: 'pointer', background: perfilAbierto ? 'var(--surface-2)' : 'none',
              border: 'none', padding: '4px 6px', borderRadius: 10,
            }}
            title="Mi perfil"
          >
            <Avatar config={profile?.broti_config} />
            <div style={{ lineHeight: 1.15, textAlign: 'left' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap' }}>
                {nombre || 'Mi perfil'}
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--ink-soft)' }}>{rol}</div>
            </div>
          </button>

          {/* Card flotante — animación rápida de opacidad + escala, sin navegar */}
          <div style={{
            position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: 260, zIndex: 40,
            background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 18,
            boxShadow: 'var(--shadow-md)', padding: 18,
            opacity: perfilAbierto ? 1 : 0,
            transform: perfilAbierto ? 'translateY(0) scale(1)' : 'translateY(-6px) scale(.97)',
            pointerEvents: perfilAbierto ? 'auto' : 'none',
            transformOrigin: 'top right',
            transition: 'opacity 160ms ease, transform 160ms ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <Avatar config={profile?.broti_config} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {nombre || 'Mi perfil'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{rol}</div>
              </div>
            </div>

            <div style={{
              height: 6, background: 'var(--surface-2)', borderRadius: 999,
              margin: '14px 0 6px', overflow: 'hidden',
            }}>
              <div style={{
                width: `${porcentajePerfil}%`, height: '100%',
                background: 'linear-gradient(90deg, var(--primary), var(--accent))',
                borderRadius: 999,
              }} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginBottom: 12 }}>
              Perfil {porcentajePerfil}% completo
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 14 }}>
              {DATOS_PERFIL.map(({ label, valor }) => {
                const dato = valor(profile);
                return (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12.5 }}>
                    <span style={{ color: 'var(--ink-soft)' }}>{label}</span>
                    <span style={{
                      fontWeight: 600, color: dato ? 'var(--ink)' : 'var(--ink-soft)',
                      textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140,
                    }}>{dato || 'Sin definir'}</span>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => { setPerfilAbierto(false); navigate(esInstitucion ? '/dashboard/institucion' : '/dashboard/perfil'); }}
              style={{
                width: '100%', background: 'var(--primary)', color: 'var(--primary-ink)',
                fontWeight: 700, fontSize: 12.5, padding: 10, borderRadius: 10,
                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Editar perfil →
            </button>
          </div>
        </div>

        <button
          onClick={() => handleLogout(isDemoMode)}
          title="Cerrar sesión"
          style={{ ...iconBtn, fontSize: 16 }}
        >↩</button>
      </div>

    </header>
    </>
  );
}
