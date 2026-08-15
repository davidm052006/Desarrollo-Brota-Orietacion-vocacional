import { useState, useEffect } from 'react';
import { supabase } from '../../../config/supabase';
import { getStats } from '../../../services/adminService';
import DashboardLayout from '../../../components/Layout/DashboardLayout';
import StatsCard from './components/StatsCard';
import ModulesNav from './components/ModulesNav';
import UsuariosSection from './sections/UsuariosSection';
import OportunidadesSection from './sections/OportunidadesSection';
import InstitucionesSection from './sections/InstitucionesSection';
import CuestionariosSection from './sections/CuestionariosSection';
import PreguntasSection from './sections/PreguntasSection';
import ConfiguracionSection from './sections/ConfiguracionSection';
import ContactosSection from './sections/ContactosSection';

const SECTIONS = {
  usuarios:      UsuariosSection,
  oportunidades: OportunidadesSection,
  instituciones: InstitucionesSection,
  cuestionarios: CuestionariosSection,
  preguntas:     PreguntasSection,
  contactos:     ContactosSection,
  configuracion: ConfiguracionSection,
};

const STAT_DEFS = [
  { key: 'perfiles_usuario', label: 'Usuarios',      icon: '👥', color: 'green'  },
  { key: 'programas',        label: 'Programas',     icon: '💼', color: 'yellow' },
  { key: 'instituciones',    label: 'Instituciones', icon: '🏛️', color: 'blue'   },
  { key: 'cuestionarios',    label: 'Cuestionarios', icon: '📋', color: 'purple' },
  { key: 'preguntas',        label: 'Preguntas',     icon: '❓', color: 'red'    },
];

export default function AdminPanel({ user, profile }) {
  const [activeSection, setActiveSection] = useState('usuarios');
  const [isAdmin, setIsAdmin]             = useState(null); // null=checking, true/false
  const [stats, setStats]                 = useState({});

  // Id del cuestionario a preseleccionar cuando se navega a "Preguntas"
  // desde el botón "Ver preguntas" de CuestionariosSection.
  const [filtroCuestionarioId, setFiltroCuestionarioId] = useState('');

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user?.id) { setIsAdmin(false); return; }
      const { data, error } = await supabase
        .from('perfiles_usuario')
        .select('rol')
        .eq('user_id', user.id)
        .single();
      setIsAdmin(!error && data?.rol === 'admin');
    };
    checkAdminRole();
  }, [user]);

  useEffect(() => {
    if (!isAdmin) return;
    getStats().then(({ success, data }) => { if (success) setStats(data); });
  }, [isAdmin]);

  // Navega a la sección Preguntas dejando pre-seteado el filtro por cuestionario_id.
  const verPreguntasDeCuestionario = (cuestionarioId) => {
    setFiltroCuestionarioId(cuestionarioId);
    setActiveSection('preguntas');
  };

  if (isAdmin === null) {
    return (
      <DashboardLayout profile={profile}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="animate-spin" style={{
              width: 40, height: 40, border: '3px solid var(--line)',
              borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 12px',
            }} />
            <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Verificando acceso...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAdmin) {
    return (
      <DashboardLayout profile={profile}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🔒</div>
            <div className="font-display" style={{ fontWeight: 800, fontSize: 22, marginBottom: 8 }}>Acceso restringido</div>
            <div style={{ fontSize: 14, color: 'var(--ink-soft)' }}>Solo los administradores pueden ver esta sección.</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const SectionComponent = SECTIONS[activeSection];

  return (
    <DashboardLayout profile={profile}>
      <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* Encabezado */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div className="font-display" style={{ fontWeight: 800, fontSize: 26, letterSpacing: '-0.6px' }}>
              Panel de administración 🛡️
            </div>
            <div style={{ color: 'var(--ink-soft)', fontSize: 13.5, marginTop: 2 }}>
              Gestiona y administra todas las partes del sistema.
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 13 }}>
          {STAT_DEFS.map(({ key, label, icon, color }) => (
            <StatsCard
              key={key}
              label={label}
              value={stats[key] !== undefined ? stats[key].toLocaleString('es-CO') : '—'}
              icon={icon}
              color={color}
            />
          ))}
        </div>

        {/* Module tabs */}
        <ModulesNav active={activeSection} onChange={setActiveSection} />

        {/* Section content */}
        <SectionComponent
          onVerPreguntas={verPreguntasDeCuestionario}
          filtroCuestionarioId={filtroCuestionarioId}
        />

      </div>
    </DashboardLayout>
  );
}