import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAdmin } from '../../hooks/useAdmin';
import { useDarkMode } from '../../hooks/useDarkMode';
import { handleLogout } from '../../utils/auth';

const NAV_ITEMS = [
  { to: '/dashboard',             label: 'Inicio',         end: true },
  { to: '/dashboard/profesiones', label: 'Explorar' },
  { to: '/dashboard/test',        label: 'Test vocacional' },
  { to: '/dashboard/rutas',       label: 'Rutas' },
  { to: '/dashboard/recursos',    label: 'Recursos' },
  { to: '/dashboard/comunidad',   label: 'Comunidad' },
];

function Avatar({ nombre }) {
  const initial = (nombre || 'U').charAt(0).toUpperCase();
  return (
    <span
      style={{
        width: 36, height: 36, borderRadius: '50%',
        background: 'var(--primary)', color: 'var(--primary-ink)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 14,
        flexShrink: 0,
      }}
    >
      {initial}
    </span>
  );
}

export default function TopNavbar({ profile, isDemoMode = false }) {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [dark, toggleDark] = useDarkMode();
  const navigate = useNavigate();
  const location = useLocation();

  const nombre = profile?.nombre || profile?.primer_nombre || '';
  const rol = isAdmin ? 'Administrador' : 'Estudiante';

  const iconBtn = {
    width: 38, height: 38, borderRadius: 11,
    background: 'var(--surface-2)', border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 15, color: 'var(--ink-soft)', transition: 'opacity .15s',
  };

  return (
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
        {NAV_ITEMS.map(({ to, label, end }) => (
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
            onClick={() => navigate('/dashboard/mensajes')}
            title="Mensajes"
            style={iconBtn}
          ><img src="/icons/icon-mensajes.svg" alt="Mensajes" style={{ width: 18, height: 18 }} /></button>
          <span style={{
            position: 'absolute', top: 6, right: 6,
            width: 7, height: 7, borderRadius: '50%',
            background: 'var(--accent)',
          }} />
        </div>

        <button
          onClick={toggleDark}
          title={dark ? 'Modo claro' : 'Modo oscuro'}
          style={{ ...iconBtn, background: 'var(--accent-soft)', color: 'var(--accent)' }}
        >
          {dark ? '☀️' : '🌙'}
        </button>

        <div style={{ width: 1, height: 26, background: 'var(--line)', margin: '0 2px' }} />

        <button
          onClick={() => navigate('/dashboard/ajustes')}
          style={{
            display: 'flex', alignItems: 'center', gap: 9,
            cursor: 'pointer', background: 'none', border: 'none', padding: '4px 6px',
            borderRadius: 10,
          }}
          title="Mi perfil"
        >
          <Avatar nombre={nombre} />
          <div style={{ lineHeight: 1.15, textAlign: 'left' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap' }}>
              {nombre || 'Mi perfil'}
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--ink-soft)' }}>{rol}</div>
          </div>
        </button>

        <button
          onClick={() => handleLogout(isDemoMode)}
          title="Cerrar sesión"
          style={{ ...iconBtn, fontSize: 16 }}
        >↩</button>
      </div>

    </header>
  );
}
