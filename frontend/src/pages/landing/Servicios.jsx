import { useNavigate } from 'react-router-dom';
import LoginNavbar from './components/LoginNavbar';
import { useDarkMode } from '../../hooks/useDarkMode';

const serviciosDestacados = [
  {
    icon: '🧭',
    titulo: 'Descubre quién eres',
    subtitulo: 'Test Vocacional Inteligente',
    items: ['Preguntas sobre intereses', 'Habilidades y fortalezas', 'Disponibilidad de tiempo', 'Contexto socioeconómico', 'Resultados personalizados'],
    descripcion: 'Conoce las áreas profesionales que mejor se adaptan a ti.',
  },
  {
    icon: '🎯',
    titulo: 'Encuentra oportunidades reales',
    subtitulo: 'Recomendaciones Personalizadas',
    items: ['Carreras universitarias', 'Programas técnicos', 'Tecnologías', 'Cursos especializados', 'Formación alternativa'],
    descripcion: 'Recibe sugerencias basadas en tu perfil vocacional.',
  },
  {
    icon: '🏫',
    titulo: 'Explora instituciones verificadas',
    subtitulo: 'Catálogo Curado',
    items: ['Instituciones colombianas verificadas', 'Información actualizada', 'Datos de contacto', 'Ubicación', 'Oferta académica'],
    descripcion: 'Información confiable para tomar decisiones seguras.',
  },
  {
    icon: '📅',
    titulo: 'No pierdas ninguna convocatoria',
    subtitulo: 'Seguimiento de Inscripciones',
    items: ['Fechas de apertura', 'Fechas de cierre', 'Convocatorias activas', 'Programas disponibles'],
    descripcion: 'Encuentra oportunidades vigentes sin perder tiempo.',
  },
];

const serviciosSecundarios = [
  { icon: '🔍', titulo: 'Orientación Vocacional',  descripcion: 'Descubre tus intereses, fortalezas y áreas de desarrollo mediante nuestro cuestionario especializado.' },
  { icon: '🎓', titulo: 'Exploración Académica',   descripcion: 'Encuentra programas educativos que se ajusten a tus objetivos y posibilidades.' },
  { icon: '🏛️', titulo: 'Búsqueda de Instituciones', descripcion: 'Consulta instituciones verificadas y compara sus programas académicos.' },
  { icon: '📋', titulo: 'Convocatorias Activas',   descripcion: 'Accede a oportunidades educativas disponibles y evita programas con inscripciones cerradas.' },
];

const razones = [
  'Recomendaciones personalizadas',
  'Instituciones verificadas',
  'Convocatorias actualizadas',
  'Considera contexto socioeconómico',
  'Diseño amigable para estudiantes',
  'Gratuito',
];

const pasos = [
  { num: '1', titulo: 'Responde el cuestionario', desc: 'Completa una evaluación rápida sobre tus intereses y habilidades.' },
  { num: '2', titulo: 'Obtén tu perfil',          desc: 'Generamos un perfil vocacional personalizado.' },
  { num: '3', titulo: 'Recibe recomendaciones',   desc: 'Te mostramos programas e instituciones alineadas contigo.' },
  { num: '4', titulo: 'Da el siguiente paso',     desc: 'Explora convocatorias y comienza tu camino educativo.' },
];

const proximamente = [
  { icon: '🚀', label: 'Más instituciones educativas' },
  { icon: '🗺️', label: 'Nuevas rutas formativas' },
  { icon: '📖', label: 'Recursos para orientación profesional' },
  { icon: '🌱', label: 'Herramientas de apoyo para estudiantes' },
];

export default function Servicios() {
  const navigate = useNavigate();
  const [dark, toggleDark] = useDarkMode();

  return (
    <div className="min-h-screen bg-white dark:bg-[#111318]">

      {/* Toggle modo oscuro */}
      <button
        onClick={toggleDark}
        title={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        className="fixed top-4 right-4 z-50 w-9 h-9 flex items-center justify-center rounded-full bg-white/80 dark:bg-[#1a1d24] border border-gray-200 dark:border-[#2c3140] shadow-sm hover:shadow-md text-base transition-all backdrop-blur-sm"
      >
        {dark ? '☀️' : '🌙'}
      </button>

      <LoginNavbar />

      {/* ── Hero ── */}
      <section className="pt-28 pb-16 px-6 text-center bg-gradient-to-b from-primary-soft to-white dark:from-[#0d1a12] dark:to-[#111318]">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-3">
          Nuestros servicios 🌿
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto mb-8 text-base">
          En BROTA te acompañamos desde la exploración de tus intereses
          hasta la identificación de oportunidades educativas reales en Colombia.
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] shadow-md transition-all duration-200"
          >
            Comenzar test vocacional ✓
          </button>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl border-2 border-[var(--color-primary)] text-primary hover:bg-primary-soft dark:hover:bg-[#0d1a12] transition-all duration-200"
          >
            Explorar profesiones ✓
          </button>
        </div>
      </section>

      {/* ── ¿Cómo te ayudamos? ── */}
      <section className="py-16 px-6 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white text-center mb-10">¿Cómo te ayudamos?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {serviciosDestacados.map((s) => (
            <div key={s.titulo} className="border border-gray-100 dark:border-[#2c3140] bg-white dark:bg-[#1a1d24] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-primary-soft dark:bg-[#0d1a12] flex items-center justify-center text-2xl mb-3">{s.icon}</div>
              <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm mb-0.5">{s.titulo}</h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">{s.subtitulo}</p>
              <ul className="space-y-1 mb-3">
                {s.items.map((item) => (
                  <li key={item} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-1.5">
                    <span className="text-primary mt-0.5">●</span> {item}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{s.descripcion}</p>
              <span className="text-primary text-sm">→</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Nuestros servicios (cards secundarias) ── */}
      <section className="py-12 px-6 bg-gray-50 dark:bg-[#14171e]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white text-center mb-10">Nuestros servicios</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {serviciosSecundarios.map((s) => (
              <div key={s.titulo} className="bg-white dark:bg-[#1a1d24] border border-gray-100 dark:border-[#2c3140] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-primary-soft dark:bg-[#0d1a12] flex items-center justify-center text-2xl mb-3">{s.icon}</div>
                <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm mb-2">{s.titulo}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{s.descripcion}</p>
                <button
                  onClick={() => navigate('/saber-mas')}
                  className="flex items-center gap-2 text-xs text-primary font-medium hover:underline"
                >
                  <span>→</span> <span>Saber más</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Por qué BROTA + Nuestro proceso ── */}
      <section className="py-16 px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">¿Por qué elegir BROTA?</h2>
            <ul className="space-y-3">
              {razones.map((r) => (
                <li key={r} className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300">
                  <span>{r}</span>
                  <span className="w-6 h-6 rounded-full bg-primary-soft dark:bg-[#0d1a12] flex items-center justify-center text-primary text-xs">✓</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Nuestro proceso</h2>
            <div className="grid grid-cols-2 gap-4">
              {pasos.map((p) => (
                <div key={p.num} className="bg-primary-soft dark:bg-[#0d1a12] rounded-2xl p-4">
                  <div className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center mb-2">{p.num}</div>
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1">{p.titulo}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Próximamente ── */}
      <section className="py-10 px-6 bg-gray-50 dark:bg-[#14171e]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-lg font-bold text-gray-700 dark:text-gray-200 text-center mb-6">Próximamente</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {proximamente.map((p) => (
              <div key={p.label} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                <span className="text-xl">{p.icon}</span>
                <span>{p.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="py-14 px-6 bg-primary-soft dark:bg-[#0d1a12] text-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">¿Listo para descubrir tu futuro? 🌿</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
          Miles de posibilidades te esperan.<br />
          Comienza hoy tu proceso de orientación vocacional.
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] shadow-md transition-all duration-200"
          >
            Realizar test vocacional ✓
          </button>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl border-2 border-[var(--color-primary)] text-primary hover:bg-primary-soft dark:hover:bg-[#112010] transition-all duration-200"
          >
            Explorar profesiones ✓
          </button>
        </div>
      </section>
    </div>
  );
}
