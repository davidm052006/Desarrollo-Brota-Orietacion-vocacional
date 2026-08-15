import { useState } from 'react';
import DashboardLayout from '../../components/Layout/DashboardLayout';

const CATEGORIAS = [
  { key: 'todos',        label: 'Todos',         emoji: '✨' },
  { key: 'guias',        label: 'Guías',          emoji: '📄' },
  { key: 'videos',       label: 'YouTube',        emoji: '▶️' },
  { key: 'becas',        label: 'Becas',          emoji: '🎓' },
  { key: 'herramientas', label: 'Herramientas',   emoji: '🔧' },
];

// tint: 'green' → primary-soft / 'accent' → accent-soft
const RECURSOS = [
  { id: 1,  categoria: 'guias',        emoji: '🧭', tint: 'green',  tag: 'Guía esencial',       titulo: 'Cómo elegir tu carrera',                      descripcion: 'Pasos concretos para tomar una decisión vocacional sin presión: intereses, habilidades, mercado laboral y valores personales.', accion: 'Leer guía',       url: 'https://www.mineducacion.gov.co/portal/Educacion-superior/' },
  { id: 2,  categoria: 'guias',        emoji: '📝', tint: 'accent', tag: 'Examen de estado',     titulo: 'Todo sobre el ICFES / Saber 11',               descripcion: 'Qué evalúa, cómo registrarte, fechas de inscripción, estrategias de estudio y cómo interpretar tu puntaje.',             accion: 'Ver guía',        url: 'https://www.icfes.gov.co/saber-11' },
  { id: 3,  categoria: 'guias',        emoji: '🏫', tint: 'green',  tag: 'Rutas educativas',     titulo: 'Universidad, SENA o técnico: ¿cuál es para ti?', descripcion: 'Comparación honesta entre las tres rutas: duración, costos, salidas laborales y compatibilidad con tu perfil.',           accion: 'Ver guía',        url: 'https://www.sena.edu.co/' },
  { id: 4,  categoria: 'guias',        emoji: '🔍', tint: 'green',  tag: 'Verificación oficial', titulo: 'Consultar programas acreditados (SNIES)',       descripcion: 'El SNIES te permite verificar si un programa está registrado y acreditado oficialmente.',                                   accion: 'Ir al SNIES',     url: 'https://snies.mineducacion.gov.co/portal/' },
  { id: 5,  categoria: 'guias',        emoji: '💼', tint: 'accent', tag: 'Empleabilidad',        titulo: 'Cómo hacer tu primera hoja de vida',           descripcion: 'Qué incluir cuando no tienes experiencia, cómo resaltar logros académicos y voluntariados, y cómo adaptarla a cada oferta.', accion: 'Ver guía',        url: 'https://www.mintrabajo.gov.co/' },
  { id: 6,  categoria: 'becas',        emoji: '🎓', tint: 'green',  tag: 'Crédito educativo',    titulo: 'ICETEX — Crédito educativo',                   descripcion: 'Créditos condonables y subsidiados para estudiar en Colombia o en el exterior. El mayor fondo de financiación educativa.',     accion: 'Más información', url: 'https://portal.icetex.gov.co/' },
  { id: 7,  categoria: 'becas',        emoji: '⭐', tint: 'green',  tag: 'MinEducación',         titulo: 'Generación E — Excelencia',                    descripcion: 'Beca del MinEducación para los mejores puntajes ICFES de municipios con menores ingresos. Cubre matrícula en IES acreditadas.', accion: 'Más información', url: 'https://www.mineducacion.gov.co/generacione/' },
  { id: 8,  categoria: 'becas',        emoji: '🌟', tint: 'green',  tag: 'MinEducación',         titulo: 'Generación E — Equidad',                       descripcion: 'Subsidio de sostenimiento para estudiantes de estratos 1, 2 y 3 que ingresen a IES públicas.',                               accion: 'Más información', url: 'https://www.mineducacion.gov.co/generacione/' },
  { id: 9,  categoria: 'becas',        emoji: '💡', tint: 'accent', tag: 'Prosperidad Social',   titulo: 'Jóvenes en Acción',                            descripcion: 'Transferencia monetaria condicionada para estudiantes de SENA o IES públicas. Apoya gastos de transporte y alimentación.',    accion: 'Más información', url: 'https://prosperidadsocial.gov.co/sgpp/transferencias/jovenes-en-accion/' },
  { id: 10, categoria: 'becas',        emoji: '🏆', tint: 'accent', tag: 'Banco República',      titulo: 'Becas Banco de la República',                  descripcion: 'Convocatorias anuales para posgrados en el exterior destinadas a colombianos con trayectoria sobresaliente.',                accion: 'Más información', url: 'https://www.banrepcultural.org/becas-y-premios' },
  { id: 11, categoria: 'herramientas', emoji: '📊', tint: 'green',  tag: 'Gratuito',             titulo: 'Oferta educativa SENA',                        descripcion: 'Explora todos los programas técnicos, tecnólogos y de formación complementaria disponibles en tu región.',                    accion: 'Explorar oferta', url: 'https://oferta.senasofiaplus.edu.co/' },
  { id: 12, categoria: 'herramientas', emoji: '🧪', tint: 'accent', tag: 'Preparación',          titulo: 'Simulacro ICFES oficial',                      descripcion: 'Practica con los simulacros gratuitos del ICFES para familiarizarte con el formato y los tipos de preguntas del Saber 11.',    accion: 'Ir al simulacro', url: 'https://www.icfes.gov.co/' },
  { id: 13, categoria: 'herramientas', emoji: '🗺️', tint: 'green',  tag: 'Orientación oficial',  titulo: 'Orientame — MinEducación',                     descripcion: 'Portal oficial de orientación socioocupacional del Ministerio. Incluye info de carreras, mercado laboral y test.',              accion: 'Ir al portal',    url: 'https://www.mineducacion.gov.co/portal/Educacion-superior/' },
  { id: 14, categoria: 'herramientas', emoji: '💻', tint: 'accent', tag: 'Cursos gratis',        titulo: 'Coursera for Campus',                          descripcion: 'Cursos gratuitos de universidades del mundo (Google, IBM, Meta). Muchas IES colombianas tienen convenio activo.',             accion: 'Ver cursos',      url: 'https://www.coursera.org/' },
  { id: 15, categoria: 'videos',       emoji: '🎬', tint: 'accent', tag: 'TED Talk',             titulo: '¿Cómo saber qué estudiar?',                    descripcion: 'Charla sobre cómo identificar tu pasión y convertirla en una carrera real. Subtitulada al español.',                          accion: 'Ver video',       url: 'https://www.youtube.com/watch?v=jpe-LKn-4gM' },
  { id: 16, categoria: 'videos',       emoji: '🌱', tint: 'green',  tag: 'Tutorial',             titulo: 'SENA: qué es y cómo inscribirte',              descripcion: 'Explicación completa del proceso de inscripción al SENA, tipos de programas disponibles y ventajas.',                         accion: 'Ver video',       url: 'https://www.youtube.com/watch?v=2wZkSiC5OQg' },
  { id: 17, categoria: 'videos',       emoji: '🚀', tint: 'accent', tag: 'Guía en video',        titulo: 'Cómo conseguir tu primera beca en Colombia',   descripcion: 'Paso a paso: ICETEX, Generación E, plazos, documentos requeridos y errores comunes al aplicar.',                           accion: 'Ver video',       url: 'https://www.youtube.com/results?search_query=becas+colombia+jovenes' },
  { id: 18, categoria: 'videos',       emoji: '🧠', tint: 'accent', tag: 'Educativo',            titulo: 'Inteligencias múltiples y vocación',           descripcion: 'Cómo la teoría de Gardner puede ayudarte a entender en qué áreas sobresales y qué carreras se alinean contigo.',              accion: 'Ver video',       url: 'https://www.youtube.com/results?search_query=inteligencias+multiples+vocacion' },
];

function RecursoCard({ recurso }) {
  const tint     = recurso.tint === 'accent' ? 'var(--accent-soft)'  : 'var(--primary-soft)';
  const tagColor = recurso.tint === 'accent' ? 'var(--accent)'       : 'var(--primary-deep)';

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 18,
      padding: 18, boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', gap: 10,
      transition: 'box-shadow .15s, transform .15s', cursor: 'default',
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow)'; e.currentTarget.style.transform = ''; }}
    >
      {/* Icon + tag */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12, background: tint,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, flexShrink: 0,
        }}>
          {recurso.emoji}
        </div>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: tagColor }}>{recurso.tag}</span>
      </div>

      {/* Título */}
      <div className="font-display" style={{ fontWeight: 700, fontSize: 15.5, lineHeight: 1.2 }}>
        {recurso.titulo}
      </div>

      {/* Descripción */}
      <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.5, flex: 1 }}>
        {recurso.descripcion}
      </div>

      {/* CTA */}
      <a
        href={recurso.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}
      >
        {recurso.accion} →
      </a>
    </div>
  );
}

export default function Recursos() {
  const [categoriaActiva, setCategoriaActiva] = useState('todos');
  const [busqueda, setBusqueda] = useState('');

  const filtrados = RECURSOS.filter(r => {
    const matchCat    = categoriaActiva === 'todos' || r.categoria === categoriaActiva;
    const matchSearch = busqueda === '' ||
      r.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
      r.descripcion.toLowerCase().includes(busqueda.toLowerCase());
    return matchCat && matchSearch;
  });

  const filtStyle = (active) => ({
    fontSize: 12.5, fontWeight: active ? 700 : 600,
    padding: '8px 15px', borderRadius: 999, cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 6, border: 'none',
    background: active ? 'var(--primary)' : 'var(--surface)',
    color: active ? 'var(--primary-ink)' : 'var(--ink-soft)',
    boxShadow: active ? 'none' : '0 0 0 1px var(--line)',
  });

  return (
    <DashboardLayout>
      <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* ── Encabezado ─────────────────────────────────────────────────────── */}
        <div>
          <div className="font-display" style={{ fontWeight: 800, fontSize: 26, letterSpacing: '-0.6px' }}>
            Recursos
          </div>
          <div style={{ color: 'var(--ink-soft)', fontSize: 13.5, marginTop: 2 }}>
            Guías, becas, herramientas y videos para apoyar tu camino educativo.
          </div>
        </div>

        {/* ── Filtros + búsqueda ─────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
            {CATEGORIAS.map(({ key, label, emoji }) => (
              <button key={key} onClick={() => setCategoriaActiva(key)} style={filtStyle(categoriaActiva === key)}>
                {emoji} {label}
              </button>
            ))}
          </div>
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12,
            padding: '9px 14px', fontSize: 13, color: 'var(--ink-soft)',
            display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
          }}>
            <img src="/icons/icon-buscar.svg" alt="" style={{ width: 14, height: 14 }} />
            <input
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar recurso…"
              style={{
                border: 'none', outline: 'none', fontSize: 13,
                color: 'var(--ink)', background: 'transparent', fontFamily: 'inherit', width: 160,
              }}
            />
            {busqueda && (
              <button onClick={() => setBusqueda('')} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 16, color: 'var(--ink-soft)', lineHeight: 1,
              }}>×</button>
            )}
          </div>
        </div>

        {/* ── Grid de recursos ─────────────────────────────────────────────────── */}
        {filtrados.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {filtrados.map(r => <RecursoCard key={r.id} recurso={r} />)}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--ink-soft)' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>No hay recursos que coincidan.</div>
          </div>
        )}

        {/* ── Footer ─────────────────────────────────────────────────────────── */}
        <div style={{
          background: 'var(--primary-soft)', border: '1px solid var(--line)',
          borderRadius: 18, padding: '16px 20px',
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary-deep)' }}>
            ¿Conoces un recurso útil que no está aquí?
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 4 }}>
            Próximamente podrás sugerir recursos desde esta sección. Por ahora, compártelo con tu orientador.
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
