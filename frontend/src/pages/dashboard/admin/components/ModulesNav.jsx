const MODULES = [
  { key: 'usuarios',      icon: '👥', icono: '/icons/icon-comunidad.svg',      label: 'Usuarios'       },
  { key: 'oportunidades', icon: '💼', label: 'Oportunidades'  },
  { key: 'instituciones', icon: '🏛️', icono: '/icons/icon-instituciones.svg',  label: 'Instituciones'  },
  { key: 'cuestionarios', icon: '📋', label: 'Cuestionarios'  },
  { key: 'preguntas',     icon: '❓', label: 'Preguntas'      },
  { key: 'preguntas_comunidad', icon: '🚩', label: 'Preguntas comunidad' },
  { key: 'contactos',     icon: '📬', icono: '/icons/icon-mensajes.svg',       label: 'Solicitudes'    },
  { key: 'configuracion', icon: '⚙️', icono: '/icons/icon-ajustes.svg',        label: 'Configuración'  },
];

export default function ModulesNav({ active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {MODULES.map(({ key, icon, icono, label }) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '10px 16px', borderRadius: 11, fontSize: 13,
              fontWeight: isActive ? 700 : 600, cursor: 'pointer',
              border: isActive ? 'none' : '1px solid var(--line)',
              background: isActive ? 'var(--primary)' : 'var(--surface)',
              color: isActive ? 'var(--primary-ink)' : 'var(--ink-soft)',
              fontFamily: 'inherit', whiteSpace: 'nowrap',
              transition: 'all .15s',
            }}
          >
            <span>{icono ? <img src={icono} alt="" style={{ width: 14, height: 14 }} /> : icon}</span>
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
