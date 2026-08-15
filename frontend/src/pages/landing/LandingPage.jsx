import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDarkMode } from '../../hooks/useDarkMode';

const HERO_SEGMENTS = [
  { text: 'Descubre ', primary: false, start: 0 },
  { text: 'quién', primary: true, start: 9 },
  { text: ' quieres ser.', primary: false, start: 14 },
];
const HERO_TEXT_LENGTH = HERO_SEGMENTS.reduce((sum, s) => sum + s.text.length, 0);

function useTypewriter(totalLength, speedMs = 45) {
  const [typedCount, setTypedCount] = useState(0);

  useEffect(() => {
    if (totalLength === 0) return;
    const interval = setInterval(() => {
      setTypedCount((prev) => {
        if (prev >= totalLength) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, speedMs);
    return () => clearInterval(interval);
  }, [totalLength, speedMs]);

  return typedCount;
}

const NAV_LINKS = [
  { label: 'Cómo funciona', href: '#como-funciona' },
  { label: 'Beneficios',    href: '#beneficios'    },
  { label: 'Testimonios',   href: '#testimonios'   },
  { label: 'FAQ',           href: '#faq'           },
];

const PASOS = [
  { num: '01', tint: 'var(--primary-soft)', numColor: 'var(--primary-deep)', icon: '🧭',
    titulo: 'Explora quién eres',
    desc: 'Responde actividades diseñadas para conocer tus intereses, habilidades y motivaciones.' },
  { num: '02', tint: 'var(--accent-soft)',  numColor: 'var(--accent)',        icon: '🚩',
    titulo: 'Descubre opciones',
    desc: 'Te mostramos carreras y áreas que realmente van contigo.' },
  { num: '03', tint: 'var(--primary-soft)', numColor: 'var(--primary-deep)', icon: '🌱',
    titulo: 'Elige tu mejor paso',
    desc: 'Recibe recomendaciones personalizadas para tomar decisiones con confianza.' },
];

const BENEFITS = [
  { icon: '✅', tint: 'var(--primary-soft)', titulo: 'Sin presión, a tu ritmo',     desc: 'Tú decides cuándo y cómo avanzar.' },
  { icon: '⭐', tint: 'var(--accent-soft)',  titulo: 'Resultados que entiendes',     desc: 'Recomendaciones basadas en lo que eres y te gusta.' },
  { icon: '👥', tint: 'var(--primary-soft)', titulo: 'Diseñado para jóvenes',       desc: 'Lenguaje claro, cercano y motivador.' },
  { icon: '🔒', tint: 'var(--accent-soft)',  titulo: 'Privado y seguro',             desc: 'Tu información está protegida siempre.' },
];

// ─── Navbar ──────────────────────────────────────────────────────────────────

function Navbar({ dark, toggleDark }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'var(--bg)',
      borderBottom: '1px solid var(--line)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 40px', height: 64,
    }}>
      {/* Logo */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
        <img src="/logo-brota.png" alt="Brota" style={{ height: 28, width: 'auto' }} />
        <span className="font-display" style={{ fontWeight: 800, fontSize: 20, color: 'var(--ink)', letterSpacing: '-0.5px' }}>
          BROTA
        </span>
      </Link>

      {/* Links desktop */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
        {NAV_LINKS.map(({ label, href }) => (
          <a key={label} href={href} style={{
            fontSize: 13.5, fontWeight: 600, color: 'var(--ink-soft)',
            textDecoration: 'none', transition: 'color .15s',
          }}
            onMouseEnter={e => e.target.style.color = 'var(--ink)'}
            onMouseLeave={e => e.target.style.color = 'var(--ink-soft)'}
          >{label}</a>
        ))}

        <button
          onClick={toggleDark}
          style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'var(--surface-2)', border: 'none',
            cursor: 'pointer', fontSize: 15, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}
          title={dark ? 'Modo claro' : 'Modo oscuro'}
        >
          {dark ? '☀️' : '🌙'}
        </button>

        <button
          onClick={() => navigate('/login')}
          style={{
            background: 'var(--primary)', color: 'var(--primary-ink)',
            padding: '10px 20px', borderRadius: 999,
            fontWeight: 700, fontSize: 13.5,
            border: 'none', cursor: 'pointer',
            boxShadow: '0 4px 14px var(--primary-glow)',
          }}
        >
          Empezar ahora
        </button>
      </nav>
    </header>
  );
}

// ─── Hero ────────────────────────────────────────────────────────────────────

function Hero() {
  const navigate = useNavigate();
  const typedCount = useTypewriter(HERO_TEXT_LENGTH);

  return (
    <section style={{ display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: 40, alignItems: 'center', padding: '30px 40px 50px' }}>
      <div>
        <div className="font-display" style={{
          fontWeight: 800, fontSize: 62, lineHeight: 0.98, letterSpacing: -2,
          color: 'var(--ink)',
        }}>
          {HERO_SEGMENTS.map((segment, i) => {
            const shown = segment.text.slice(0, Math.max(0, Math.min(segment.text.length, typedCount - segment.start)));
            return segment.primary
              ? <span key={i} style={{ color: 'var(--primary)' }}>{shown}</span>
              : <span key={i}>{shown}</span>;
          })}
          {typedCount < HERO_TEXT_LENGTH && (
            <span className="typewriter-cursor" style={{ color: 'var(--primary)' }}>|</span>
          )}
        </div>
        <div style={{ fontSize: 16, color: 'var(--ink-soft)', marginTop: 22, maxWidth: 430, lineHeight: 1.55 }}>
          Una experiencia pensada para ayudarte a explorar tu vocación y tomar decisiones con claridad y propósito.
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 30 }}>
          <button
            onClick={() => navigate('/login')}
            style={{
              background: 'var(--primary)', color: 'var(--primary-ink)',
              padding: '15px 30px', borderRadius: 999,
              fontWeight: 800, fontSize: 15, border: 'none', cursor: 'pointer',
              boxShadow: '0 8px 22px var(--primary-glow)',
            }}
          >
            Empieza gratis
          </button>
          <a href="#como-funciona" style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)', textDecoration: 'none' }}>
            Conocer más →
          </a>
        </div>
      </div>

      {/* Logo hero */}
      <div style={{
        position: 'relative', aspectRatio: '1.15', borderRadius: 30,
        background: 'linear-gradient(135deg, var(--primary-soft), var(--surface-2))',
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 16,
      }}>
        <div style={{
          position: 'absolute', width: '70%', aspectRatio: '1',
          borderRadius: '50%', background: 'var(--surface)',
          boxShadow: '0 20px 50px rgba(0,0,0,.08)',
        }} />
        <img
          src="/logo-brota.png"
          alt="Brota"
          style={{ position: 'relative', zIndex: 1, height: 110, width: 'auto' }}
        />
        <span
          className="font-display"
          style={{
            position: 'relative', zIndex: 1,
            fontWeight: 800, fontSize: 38, letterSpacing: '-1px',
            color: 'var(--primary)',
          }}
        >
          BROTA
        </span>
        <div style={{
          position: 'absolute', bottom: '12%', right: '16%',
          width: 32, height: 32, borderRadius: '50%',
          background: 'var(--accent)', opacity: .75,
        }} />
      </div>
    </section>
  );
}

// ─── Trust bar ───────────────────────────────────────────────────────────────

function TrustBar() {
  return (
    <div style={{
      background: 'var(--primary-soft)', padding: '14px 40px',
      display: 'flex', justifyContent: 'space-between',
      fontSize: 13, fontWeight: 600, color: 'var(--primary-deep)',
    }}>
      <span>✓ 100% gratuito</span>
      <span>👤 Sin barreras</span>
      <span>🎯 Resultados personalizados</span>
      <span>🌱 Hecho para jóvenes</span>
    </div>
  );
}

// ─── 3 pasos ─────────────────────────────────────────────────────────────────

function ComoFunciona() {
  return (
    <section id="como-funciona" style={{ padding: '48px 40px 30px' }}>
      <div className="font-display" style={{ textAlign: 'center', fontWeight: 800, fontSize: 28, color: 'var(--ink)' }}>
        Tu camino en 3 pasos
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18, marginTop: 26 }}>
        {PASOS.map(({ num, tint, numColor, icon, titulo, desc }) => (
          <div key={num} style={{
            background: 'var(--surface)', border: '1px solid var(--line)',
            borderRadius: 20, padding: 24, boxShadow: 'var(--shadow)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{
                width: 38, height: 38, borderRadius: '50%',
                background: tint, color: numColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 15,
              }}>{num}</span>
              <span style={{ fontSize: 24 }}>{icon}</span>
            </div>
            <div className="font-display" style={{ fontWeight: 700, fontSize: 17, marginTop: 16, color: 'var(--ink)' }}>{titulo}</div>
            <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 7, lineHeight: 1.5 }}>{desc}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Beneficios ───────────────────────────────────────────────────────────────

function Beneficios() {
  return (
    <section id="beneficios" style={{ padding: '32px 40px' }}>
      <div className="font-display" style={{
        textAlign: 'center', fontWeight: 800, fontSize: 26, lineHeight: 1.25, color: 'var(--ink)',
      }}>
        No se trata de elegir "bien".<br />
        Se trata de elegir lo <span style={{ color: 'var(--primary)' }}>tuyo.</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginTop: 28 }}>
        {BENEFITS.map(({ icon, tint, titulo, desc }) => (
          <div key={titulo} style={{
            background: 'var(--surface)', border: '1px solid var(--line)',
            borderRadius: 18, padding: 22, boxShadow: 'var(--shadow)', textAlign: 'center',
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, background: tint,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 23, margin: '0 auto',
            }}>{icon}</div>
            <div style={{ fontWeight: 700, fontSize: 14.5, marginTop: 14, color: 'var(--ink)' }}>{titulo}</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 6, lineHeight: 1.45 }}>{desc}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Testimonio ───────────────────────────────────────────────────────────────

function Testimonial() {
  return (
    <section id="testimonios" style={{ padding: '18px 40px 32px' }}>
      <div style={{
        background: 'var(--primary-soft)', borderRadius: 20, padding: '30px 34px',
        display: 'flex', alignItems: 'center', gap: 20,
        position: 'relative', overflow: 'hidden',
      }}>
        <span className="font-display" style={{
          fontWeight: 800, fontSize: 56, color: 'var(--primary)',
          lineHeight: 0.6, alignSelf: 'flex-start', flexShrink: 0,
        }}>"</span>
        <div className="font-display" style={{ fontWeight: 700, fontSize: 21, lineHeight: 1.35, color: 'var(--ink)', flex: 1 }}>
          Pensé que ya lo tenía todo claro, hasta que entendí que descubrirlo también es avanzar.
        </div>
        <svg width="90" height="90" viewBox="0 0 32 32" fill="none" style={{ opacity: .5, flexShrink: 0 }}>
          <path d="M16 31 V13" stroke="var(--primary)" strokeWidth="2.6"/>
          <path d="M16 17 C16 9 8 6 3 6.5 C3 15 9 18 16 18 Z" fill="var(--primary)"/>
        </svg>
      </div>
    </section>
  );
}

// ─── CTA final ───────────────────────────────────────────────────────────────

function FooterCTA() {
  const navigate = useNavigate();

  return (
    <section style={{ padding: '0 40px 40px' }}>
      <div style={{
        background: 'linear-gradient(120deg, var(--primary-deep), var(--primary))',
        borderRadius: 24, padding: 44, textAlign: 'center', color: '#fff',
        position: 'relative', overflow: 'hidden',
      }}>
        <div className="font-display" style={{ fontWeight: 800, fontSize: 30 }}>
          Tu futuro empieza con un brote.
        </div>
        <div style={{ fontSize: 15, opacity: .92, marginTop: 10 }}>
          Explora. Descúbrete. Decide con confianza.
        </div>
        <button
          onClick={() => navigate('/login')}
          style={{
            display: 'inline-block', background: '#fff', color: 'var(--primary-deep)',
            padding: '15px 34px', borderRadius: 999,
            fontWeight: 800, fontSize: 15, marginTop: 24,
            border: 'none', cursor: 'pointer',
          }}
        >
          Empezar ahora →
        </button>
        <svg width="150" height="150" viewBox="0 0 32 32" fill="none"
          style={{ position: 'absolute', left: '5%', bottom: -30, opacity: .2, pointerEvents: 'none' }}>
          <path d="M16 31 V13" stroke="#fff" strokeWidth="2.6"/>
          <path d="M16 17 C16 9 8 6 3 6.5 C3 15 9 18 16 18 Z" fill="#fff"/>
          <path d="M16 15 C16 7 24 4 29 5 C28 14 23 17 16 17 Z" fill="#fff"/>
        </svg>
      </div>
    </section>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--line)', padding: '24px 40px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      fontSize: 13, color: 'var(--ink-soft)',
    }}>
      <span className="font-display" style={{ fontWeight: 800, fontSize: 16, color: 'var(--ink)' }}>BROTA</span>
      <div style={{ display: 'flex', gap: 26, fontWeight: 600 }}>
        {[
          { label: 'Servicios', to: '/servicios' },
          { label: 'Contacto',  to: '/contacto'  },
          { label: 'Términos',  to: '/terminos'  },
          { label: 'Privacidad', to: '/privacidad'},
        ].map(({ label, to }) => (
          <Link key={label} to={to} style={{ color: 'var(--ink-soft)', textDecoration: 'none' }}>{label}</Link>
        ))}
      </div>
      <span>Hecho con 💚 para jóvenes como tú.</span>
    </footer>
  );
}

// ─── Página completa ─────────────────────────────────────────────────────────

export default function LandingPage() {
  const [dark, toggleDark] = useDarkMode();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--ink)' }}>
      <Navbar dark={dark} toggleDark={toggleDark} />
      <Hero />
      <TrustBar />
      <ComoFunciona />
      <Beneficios />
      <Testimonial />
      <FooterCTA />
      <Footer />
    </div>
  );
}
