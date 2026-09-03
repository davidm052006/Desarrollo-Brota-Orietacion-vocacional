import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerResultado } from '../../../services/perfilService';
import { storageKey, getCategoriaInfo } from '../../../utils/vocacionalCategorias';

const INTERVALO_AUTOPLAY = 6000;

// Banners fijos (2-5) — copy inventado por ahora, se puede ajustar cuando
// haya contenido real para promocionar acá.
const BANNERS_FIJOS = [
  {
    id: 'snies',
    tint: 'var(--primary-soft)', ink: 'var(--primary-deep)',
    icono: '/icons/icon-profesiones.svg',
    titulo: 'Más de 13.000 programas del SNIES',
    texto: 'Universidades, técnicos y SENA de todo el país, actualizados directo del Ministerio de Educación.',
    cta: 'Explorar profesiones →', to: '/dashboard/profesiones',
  },
  {
    id: 'riasec',
    tint: 'var(--accent-soft)', ink: 'var(--accent)',
    icono: '/icons/icon-confirmar.svg',
    titulo: 'Basado en el modelo RIASEC',
    texto: 'El test vocacional de Brota usa el estándar profesional en orientación vocacional, no preguntas al azar.',
    cta: 'Conocer el test →', to: '/dashboard/test',
  },
  {
    id: 'rutas',
    tint: 'var(--primary-soft)', ink: 'var(--primary-deep)',
    icono: '/icons/icon-ruta.svg',
    titulo: 'Rutas formativas para cada área',
    texto: 'Materias comunes, temas previos y proyectos según hacia dónde te inclina tu resultado.',
    cta: 'Ver rutas →', to: '/dashboard/rutas',
  },
  {
    id: 'comunidad',
    tint: 'var(--accent-soft)', ink: 'var(--accent)',
    icono: '/icons/icon-comunidad.svg',
    titulo: 'Sumate a la comunidad',
    texto: 'Foros, historias de otros estudiantes y preguntas resueltas por quienes ya pasaron por esto.',
    cta: 'Ir a comunidad →', to: '/dashboard/comunidad',
  },
];

function SlideTest({ estado, progreso, perfilLabel, onIrATest }) {
  const textoBoton = { completado: 'Ver resultado →', 'en-progreso': 'Continuar →', nuevo: 'Comenzar →', cargando: '...' }[estado];
  const descripcion = {
    completado:    `Tu perfil: ${perfilLabel || 'completado'}`,
    'en-progreso': 'En progreso — retomá donde lo dejaste',
    nuevo:         'Descubrí tus intereses y fortalezas en unos minutos',
    cargando:      'Cargando...',
  }[estado];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 30, height: '100%', padding: '0 10px' }}>
      <img src="/logos/logo-feliz.svg" alt="" style={{ width: 140, height: 140, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="font-display" style={{ fontSize: 34, fontWeight: 800, color: 'var(--ink)', lineHeight: 1.08 }}>
          Test vocacional
        </div>
        <div style={{ fontSize: 15, color: 'var(--ink-soft)', marginTop: 10 }}>{descripcion}</div>
        <div style={{ height: 9, background: 'var(--surface-2)', borderRadius: 999, overflow: 'hidden', marginTop: 22, maxWidth: 340 }}>
          <div style={{
            height: '100%', borderRadius: 999,
            background: 'linear-gradient(90deg, var(--primary-deep), var(--primary))',
            width: `${progreso}%`, transition: 'width .5s ease',
          }} />
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 8 }}>{progreso}% completado</div>
        <button onClick={onIrATest} disabled={estado === 'cargando'} style={{
          marginTop: 20, background: 'var(--primary)', color: 'var(--primary-ink)',
          fontWeight: 700, fontSize: 14.5, padding: '12px 24px', borderRadius: 999,
          border: 'none', cursor: estado === 'cargando' ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
        }}>
          {textoBoton}
        </button>
      </div>
    </div>
  );
}

function SlideBanner({ banner, onIr }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 28, height: '100%', padding: '0 10px' }}>
      <div style={{
        width: 96, height: 96, borderRadius: 24, background: banner.tint,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <img src={banner.icono} alt="" style={{ width: 46, height: 46 }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="font-display" style={{ fontSize: 29, fontWeight: 800, color: 'var(--ink)', lineHeight: 1.14 }}>
          {banner.titulo}
        </div>
        <div style={{ fontSize: 15, color: 'var(--ink-soft)', marginTop: 11, maxWidth: 460, lineHeight: 1.5 }}>
          {banner.texto}
        </div>
        <button onClick={() => onIr(banner.to)} style={{
          marginTop: 18, background: 'none', color: banner.ink,
          fontWeight: 800, fontSize: 14.5, padding: 0, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
        }}>
          {banner.cta}
        </button>
      </div>
    </div>
  );
}

// Props: perfilUsuarioId, userId — mismos que usaba ContinueSection, la
// primera slide reemplaza esa tarjeta de estado del test. `esInstitucion`
// oculta esa slide — una cuenta institución no toma el test, ella arma los
// cuestionarios que otros toman (ver Cuestionarios.jsx de institución).
export default function BannerCarousel({ perfilUsuarioId, userId, esInstitucion = false }) {
  const navigate = useNavigate();
  const [indice, setIndice] = useState(0);
  const [pausado, setPausado] = useState(false);

  const [estado, setEstado] = useState('cargando');
  const [progreso, setProgreso] = useState(0);
  const [perfilLabel, setPerfilLabel] = useState('');

  const timerRef = useRef(null);

  const cargarEstadoTest = async () => {
    if (esInstitucion) return; // no aplica — no toma el test, no hay nada que cargar
    setEstado('cargando');
    if (userId) {
      try {
        const raw = localStorage.getItem(storageKey(userId));
        if (raw) {
          const draft = JSON.parse(raw);
          if (Object.keys(draft.seleccionadas ?? {}).length > 0) {
            setProgreso(Math.min(Math.round(((draft.preguntaIdx ?? 0) / 30) * 100), 95) || 5);
            setEstado('en-progreso');
            return;
          }
        }
      } catch {
        // borrador corrupto o ilegible — se ignora
      }
    }
    if (perfilUsuarioId) {
      try {
        const { data } = await obtenerResultado(perfilUsuarioId);
        if (data) {
          const pfVoc = data.perfil_vocacional;
          const cat = pfVoc?.categoriaPrincipal ?? pfVoc?.perfil?.categoriaPrincipal ?? '';
          setPerfilLabel(getCategoriaInfo(cat).titulo);
          setProgreso(100);
          setEstado('completado');
          return;
        }
      } catch {
        // sin resultado guardado todavía — se ignora, cae al estado 'nuevo'
      }
    }
    setProgreso(0);
    setEstado('nuevo');
  };

  useEffect(() => { cargarEstadoTest(); }, [perfilUsuarioId, userId, esInstitucion]);

  const slides = esInstitucion
    ? BANNERS_FIJOS.map(b => ({ tipo: 'banner', banner: b }))
    : [{ tipo: 'test' }, ...BANNERS_FIJOS.map(b => ({ tipo: 'banner', banner: b }))];
  const total = slides.length;

  // Autoplay — se pausa en hover y se reinicia cada vez que se navega manual
  useEffect(() => {
    if (pausado) return;
    timerRef.current = setInterval(() => {
      setIndice(i => (i + 1) % total);
    }, INTERVALO_AUTOPLAY);
    return () => clearInterval(timerRef.current);
  }, [pausado, total]);

  const irA = (i) => setIndice((i + total) % total);
  const anterior = () => irA(indice - 1);
  const siguiente = () => irA(indice + 1);

  const flechaStyle = {
    width: 36, height: 36, borderRadius: '50%',
    background: 'var(--surface)', border: '1px solid var(--line)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', fontSize: 15, color: 'var(--ink)',
    boxShadow: 'var(--shadow)', flexShrink: 0,
  };

  return (
    <div
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      style={{
        position: 'relative',
        background: 'var(--surface)', border: '1px solid var(--line)',
        borderRadius: 24, boxShadow: 'var(--shadow)',
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '30px 18px 38px', height: 264, boxSizing: 'border-box',
      }}
    >
      <button onClick={anterior} style={flechaStyle} aria-label="Anterior">‹</button>

      <div style={{ flex: 1, minWidth: 0, height: '100%', position: 'relative', overflow: 'hidden' }}>
        {slides.map((slide, i) => (
          <div key={i} style={{
            position: 'absolute', inset: 0,
            opacity: i === indice ? 1 : 0,
            transform: i === indice ? 'translateX(0)' : 'translateX(8px)',
            transition: 'opacity 260ms ease, transform 260ms ease',
            pointerEvents: i === indice ? 'auto' : 'none',
          }}>
            {slide.tipo === 'test'
              ? <SlideTest estado={estado} progreso={progreso} perfilLabel={perfilLabel} onIrATest={() => navigate('/dashboard/test')} />
              : <SlideBanner banner={slide.banner} onIr={navigate} />}
          </div>
        ))}
      </div>

      <button onClick={siguiente} style={flechaStyle} aria-label="Siguiente">›</button>

      {/* Dots */}
      <div style={{ position: 'absolute', left: '50%', bottom: 10, transform: 'translateX(-50%)', display: 'flex', gap: 5 }}>
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => irA(i)}
            aria-label={`Ir al banner ${i + 1}`}
            style={{
              width: i === indice ? 16 : 6, height: 6, borderRadius: 999,
              border: 'none', cursor: 'pointer', padding: 0,
              background: i === indice ? 'var(--primary)' : 'var(--line)',
              transition: 'width 200ms ease, background 200ms ease',
            }}
          />
        ))}
      </div>
    </div>
  );
}
