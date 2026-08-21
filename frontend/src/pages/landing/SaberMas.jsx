import { useNavigate } from 'react-router-dom';
import LoginNavbar from './components/LoginNavbar';
import { useDarkMode } from '../../hooks/useDarkMode';

const pasosFuncionamiento = [
  { num: '1', emoji: '📋', titulo: 'Responde preguntas',      desc: 'Contestás preguntas sobre tus intereses, habilidades, valores y preferencias.' },
  { num: '2', emoji: '🧮', titulo: 'Calculamos tus puntajes', desc: 'Cada respuesta suma puntos en diferentes dimensiones.' },
  { num: '3', emoji: '👤', titulo: 'Construimos tu perfil',   desc: 'Analizamos tus puntajes para identificar tus fortalezas principales.' },
  { num: '4', emoji: '🎯', titulo: 'Encontramos coincidencias', desc: 'Comparamos tu perfil con programas educativos disponibles.' },
  { num: '5', emoji: '🎓', titulo: 'Te mostramos oportunidades', desc: 'Te presentamos instituciones y convocatorias activas que se ajustan a ti.' },
];

const dimensiones = [
  { emoji: '❤️', titulo: 'Intereses',              desc: 'Actividades y temas que disfrutas y te apasionan.' },
  { emoji: '🎨', titulo: 'Creatividad',             desc: 'Tu capacidad para generar ideas nuevas e innovadoras.' },
  { emoji: '🧠', titulo: 'Pensamiento Analítico',   desc: 'Habilidad para analizar información y resolver problemas.' },
  { emoji: '💬', titulo: 'Comunicación',             desc: 'Expresión de ideas y relación con otras personas.' },
  { emoji: '⭐', titulo: 'Liderazgo',               desc: 'Iniciativa, toma de decisiones y motivación para lograr objetivos.' },
];

const barras = [
  { emoji: '🎨', label: 'Creatividad',             nivel: 'Muy alta',   pct: 90 },
  { emoji: '🧠', label: 'Pensamiento Analítico',   nivel: 'Alta',       pct: 75 },
  { emoji: '💬', label: 'Comunicación',             nivel: 'Media alta', pct: 60 },
  { emoji: '⭐', label: 'Liderazgo',               nivel: 'Media',      pct: 50 },
  { emoji: '🤝', label: 'Trabajo en Equipo',        nivel: 'Media',      pct: 50 },
];

const obtienes = [
  'Un perfil vocacional personalizado',
  'Tus fortalezas y áreas de desarrollo',
  'Áreas profesionales compatibles contigo',
  'Programas educativos recomendados',
  'Instituciones alineadas con tu perfil',
  'Convocatorias activas disponibles',
];

const resultadoFortalezas = [
  { emoji: '🎨', label: 'Creatividad',           tag: 'Alta',  color: 'bg-primary-soft text-primary dark:bg-[#0d1a12] ' },
  { emoji: '🧠', label: 'Pensamiento Analítico', tag: 'Alta',  color: 'bg-primary-soft text-primary dark:bg-[#0d1a12] ' },
  { emoji: '💬', label: 'Comunicación',           tag: 'Media', color: 'bg-yellow-100 text-yellow-700 dark:bg-[#1a1500] dark:text-yellow-400' },
  { emoji: '⭐', label: 'Liderazgo',             tag: 'Media', color: 'bg-yellow-100 text-yellow-700 dark:bg-[#1a1500] dark:text-yellow-400' },
  { emoji: '🤝', label: 'Trabajo en Equipo',      tag: 'Media', color: 'bg-yellow-100 text-yellow-700 dark:bg-[#1a1500] dark:text-yellow-400' },
];

const carrerasRecomendadas = [
  { emoji: '🖥️', label: 'Diseño UX/UI' },
  { emoji: '📣', label: 'Marketing Digital' },
  { emoji: '📡', label: 'Comunicación Social' },
  { emoji: '✏️', label: 'Diseño Gráfico' },
];

export default function SaberMas() {
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
      <section className="pt-28 pb-16 px-6 bg-gradient-to-b from-primary-soft to-white dark:from-[#0d1a12] dark:to-[#111318]">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-10">
          <div className="flex-1">
            <button
              onClick={() => navigate('/servicios')}
              className="flex items-center gap-1 text-sm text-primary font-medium mb-6 hover:underline"
            >
              ← Volver a servicios
            </button>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-3">
              ¿Cómo funciona BROTA? 🌿
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed max-w-md">
              En BROTA te ayudamos a descubrir tu vocación y encontrar opciones educativas
              que se ajusten a ti. Conoce cómo funciona nuestro test vocacional inteligente.
            </p>
          </div>
          <div className="flex-shrink-0 w-48 h-48 bg-primary-soft dark:bg-[#0d1a12] rounded-3xl flex items-center justify-center text-8xl shadow-sm">
            📋
          </div>
        </div>
      </section>

      {/* ── Cómo funciona el test ── */}
      <section className="py-16 px-6 max-w-6xl mx-auto">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-10">¿Cómo funciona nuestro test vocacional?</h2>
        <div className="relative flex flex-col lg:flex-row gap-6">
          {pasosFuncionamiento.map((p, i) => (
            <div key={p.num} className="flex-1 flex flex-col items-center text-center relative">
              {i < pasosFuncionamiento.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-full w-8 text-primary dark:text-primary text-xl z-10 -translate-x-1/2">
                  --→
                </div>
              )}
              <div className="w-8 h-8 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center mb-3">
                {p.num}
              </div>
              <div className="text-5xl mb-3">{p.emoji}</div>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1">{p.titulo}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Qué evaluamos ── */}
      <section className="py-14 px-6 bg-gray-50 dark:bg-[#14171e]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white text-center mb-10">¿Qué evaluamos?</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
            {dimensiones.map((d) => (
              <div key={d.titulo} className="bg-white dark:bg-[#1a1d24] border border-gray-100 dark:border-[#2c3140] rounded-2xl p-5 text-center shadow-sm">
                <div className="text-4xl mb-3">{d.emoji}</div>
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1">{d.titulo}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">{d.desc}</p>
              </div>
            ))}
          </div>
          <div className="bg-white dark:bg-[#1a1d24] border border-gray-100 dark:border-[#2c3140] rounded-2xl p-4 flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
            <span className="text-lg">ℹ️</span>
            Cada respuesta suma puntos en diferentes dimensiones para construir tu perfil vocacional.
          </div>
        </div>
      </section>

      {/* ── Cómo se construye tu perfil ── */}
      <section className="py-16 px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">¿Cómo se construye tu perfil?</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
              Tus respuestas generan puntajes en cada dimensión.
              Así identificamos tus fortalezas y áreas de desarrollo.
            </p>
            <div className="space-y-4">
              {barras.map((b) => (
                <div key={b.label} className="flex items-center gap-3">
                  <span className="text-xl w-6">{b.emoji}</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300 w-44">{b.label}</span>
                  <div className="flex-1 bg-gray-100 dark:bg-[#2c3140] rounded-full h-2.5">
                    <div className="bg-primary h-2.5 rounded-full" style={{ width: `${b.pct}%` }} />
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 w-16 text-right">{b.nivel}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-primary-soft dark:bg-[#0d1a12] border border-primary/20 dark:border-[#1a3020] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🌱</span>
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">Perfil único</h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No hay dos personas iguales. Tu perfil es único y refleja quién eres y lo que puedes lograr.
            </p>
          </div>
        </div>
      </section>

      {/* ── Qué obtienes + Ejemplo resultado ── */}
      <section className="py-16 px-6 bg-gray-50 dark:bg-[#14171e]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">

          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">¿Qué obtienes al finalizar?</h2>
            <ul className="space-y-3">
              {obtienes.map((o) => (
                <li key={o} className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                  <span className="text-primary text-lg">✅</span> {o}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-1">Ejemplo de resultado</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">Este es un ejemplo de lo que verás al finalizar tu test.</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-primary mb-3">Fortalezas principales</p>
                <div className="space-y-2">
                  {resultadoFortalezas.map((f) => (
                    <div key={f.label} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                        <span>{f.emoji}</span> {f.label}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${f.color}`}>{f.tag}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-primary mb-3">Carreras recomendadas</p>
                <div className="space-y-2">
                  {carrerasRecomendadas.map((c) => (
                    <div key={c.label} className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300">
                      <span>{c.emoji}</span> {c.label}
                    </div>
                  ))}
                  <p className="text-xs text-primary font-medium mt-1">Y más opciones para ti...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="py-14 px-6 bg-primary-soft dark:bg-[#0d1a12]">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-5">
            <span className="text-6xl">🌱</span>
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-1">¿Listo para descubrir tu camino?</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Toma el test vocacional y comienza a construir tu futuro con decisiones informadas.
              </p>
            </div>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] shadow-md transition-all duration-200"
            >
              ✓ Comenzar test vocacional
            </button>
            <button
              onClick={() => navigate('/servicios')}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl border-2 border-[var(--color-primary)] text-primary hover:bg-primary-soft dark:hover:bg-[#112010] transition-all duration-200"
            >
              Explorar profesiones ✓
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer mínimo ── */}
      <footer className="py-4 px-6 bg-white dark:bg-[#111318] border-t border-gray-100 dark:border-[#2c3140]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-6 text-xs text-gray-400 dark:text-gray-500">
          <span>✅ BROTA te acompaña en cada paso de tu orientación vocacional</span>
          <span>•</span>
          <span>Información basada en instituciones verificadas y oportunidades reales en Colombia. 🌿</span>
        </div>
      </footer>
    </div>
  );
}
