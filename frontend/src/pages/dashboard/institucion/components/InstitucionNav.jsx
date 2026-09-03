import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/dashboard/institucion',            label: 'Perfil',        end: true },
  { to: '/dashboard/institucion/programas',  label: 'Programas' },
  { to: '/dashboard/institucion/usuarios',   label: 'Estudiantes' },
  { to: '/dashboard/institucion/cuestionarios', label: 'Cuestionarios' },
  { to: '/dashboard/institucion/analiticas', label: 'Analíticas' },
];

// Nav compartida entre las páginas de /dashboard/institucion — mismo
// criterio visual que ModulesNav del panel admin, pero solo con lo que le
// aplica a una cuenta institución.
export default function InstitucionNav() {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 20, borderBottom: '1px solid var(--line)', paddingBottom: 10 }}>
      {TABS.map(({ to, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          style={({ isActive }) => ({
            padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: isActive ? 700 : 600,
            textDecoration: 'none', whiteSpace: 'nowrap',
            background: isActive ? 'var(--primary)' : 'transparent',
            color: isActive ? 'var(--primary-ink)' : 'var(--ink-soft)',
          })}
        >
          {label}
        </NavLink>
      ))}
    </div>
  );
}
