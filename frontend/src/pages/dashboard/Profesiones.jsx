import { useState, useEffect, useCallback, useRef } from 'react';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import { obtenerProgramas, obtenerEstadisticas } from '../../services/programasService';

// ── Categorías ────────────────────────────────────────────────────────────────
const CATEGORIAS = [
  { key: 'todos',          emoji: '✨', label: 'Todos',             tint: 'var(--primary-soft)', color: 'var(--primary-deep)' },
  { key: 'tecnologia',     emoji: '💻', icono: '/icons/icon-categoria-tecnologia.svg', label: 'Tecnología',        tint: 'var(--primary-soft)', color: 'var(--primary-deep)' },
  { key: 'salud',          emoji: '🩺', icono: '/icons/icon-categoria-salud.svg',      label: 'Salud',             tint: 'var(--primary-soft)', color: 'var(--primary-deep)' },
  { key: 'ciencias',       emoji: '🔬', icono: '/icons/icon-categoria-ciencias.svg',   label: 'Ciencias',          tint: 'var(--primary-soft)', color: 'var(--primary-deep)' },
  { key: 'diseño',         emoji: '🎨', label: 'Diseño',            tint: 'var(--accent-soft)',  color: 'var(--accent)'       },
  { key: 'arte',           emoji: '🎭', icono: '/icons/icon-categoria-arte.svg',       label: 'Arte',              tint: 'var(--accent-soft)',  color: 'var(--accent)'       },
  { key: 'educacion',      emoji: '🎓', label: 'Educación',         tint: 'var(--primary-soft)', color: 'var(--primary-deep)' },
  { key: 'social',         emoji: '🤝', label: 'Ciencias Sociales', tint: 'var(--primary-soft)', color: 'var(--primary-deep)' },
  { key: 'comunicacion',   emoji: '📡', label: 'Comunicación',      tint: 'var(--accent-soft)',  color: 'var(--accent)'       },
  { key: 'juridico',       emoji: '⚖️', label: 'Derecho',           tint: 'var(--accent-soft)',  color: 'var(--accent)'       },
  { key: 'negocios',       emoji: '📈', icono: '/icons/icon-negocios.svg',             label: 'Negocios',          tint: 'var(--accent-soft)',  color: 'var(--accent)'       },
  { key: 'administrativo', emoji: '🏛️', label: 'Administración',    tint: 'var(--accent-soft)',  color: 'var(--accent)'       },
  { key: 'humanidades',    emoji: '📖', label: 'Humanidades',       tint: 'var(--accent-soft)',  color: 'var(--accent)'       },
  { key: 'ambiental',      emoji: '🌱', label: 'Ambiental',         tint: 'var(--primary-soft)', color: 'var(--primary-deep)' },
  { key: 'deporte',        emoji: '⚽', label: 'Deportes',          tint: 'var(--primary-soft)', color: 'var(--primary-deep)' },
];

const CAT_MAP = Object.fromEntries(CATEGORIAS.map(c => [c.key, c]));

const MODALIDADES = ['Presencial', 'A distancia', 'Virtual'];

// ── Skeleton card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16,
      padding: 16, boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', gap: 9,
    }} className="animate-pulse">
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--surface-2)', flexShrink: 0 }} />
        <div style={{ height: 20, borderRadius: 999, background: 'var(--surface-2)', width: 90 }} />
      </div>
      <div style={{ height: 15, borderRadius: 6, background: 'var(--surface-2)', width: '80%' }} />
      <div style={{ height: 15, borderRadius: 6, background: 'var(--surface-2)', width: '55%' }} />
      <div style={{ height: 12, borderRadius: 6, background: 'var(--surface-2)', width: '40%', marginTop: 6 }} />
    </div>
  );
}

// ── Tarjeta de programa ───────────────────────────────────────────────────────
function ProgramaCard({ programa }) {
  const cat  = CAT_MAP[programa.area_academica] ?? CAT_MAP.todos;
  const inst = programa.instituciones;

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16,
      padding: 16, boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column',
      gap: 9, position: 'relative', cursor: 'default',
      transition: 'box-shadow .15s, transform .15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow)'; e.currentTarget.style.transform = ''; }}
    >
      {/* Row: icon + badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, background: cat.tint,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 17, flexShrink: 0,
        }}>
          {cat.icono ? <img src={cat.icono} alt="" style={{ width: 20, height: 20 }} /> : cat.emoji}
        </div>
        <span style={{
          fontSize: 11, fontWeight: 700, color: cat.color, background: cat.tint,
          padding: '3px 10px', borderRadius: 999,
        }}>
          {cat.label}
        </span>
      </div>

      {/* Título */}
      <div className="font-display" style={{
        fontWeight: 700, fontSize: 15, lineHeight: 1.2,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>
        {programa.nombre}
      </div>

      {/* Institución */}
      {inst && (
        <div style={{ fontSize: 12, color: 'var(--ink-soft)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <img src="/icons/icon-instituciones.svg" alt="" style={{ width: 13, height: 13, flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inst.nombre}</span>
        </div>
      )}

      {/* Chips: modalidad + duración */}
      <div style={{
        display: 'flex', gap: 8, marginTop: 3, paddingTop: 11,
        borderTop: '1px solid var(--line)',
      }}>
        {programa.modalidad && (
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-soft)' }}>📍 {programa.modalidad}</span>
        )}
        {programa.duracion && (
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-soft)' }}>⏱ {programa.duracion}</span>
        )}
      </div>
    </div>
  );
}

// ── Sidebar de filtros ────────────────────────────────────────────────────────
function FilterSidebar({ categoriaActiva, onCategoriaChange, modalidad, onModalidadChange, stats, onLimpiar }) {
  const conteo = (key) => {
    if (key === 'todos') return stats.total;
    const c = stats.areas?.find(a => a.area === key)?.count ?? 0;
    return c >= 1000 ? `${(c / 1000).toFixed(1)}k` : c || '';
  };

  const VISIBLE = CATEGORIAS.slice(0, 10);

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 20,
      padding: 20, boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="font-display" style={{ fontWeight: 800, fontSize: 16 }}>Filtros</div>
        <button onClick={onLimpiar} style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>
          Limpiar
        </button>
      </div>

      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '.5px', margin: '18px 0 10px' }}>
        Área de conocimiento
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {CATEGORIAS.map(({ key, emoji, icono, label }) => {
          const active = categoriaActiva === key;
          return (
            <button key={key} onClick={() => onCategoriaChange(key)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '9px 11px', borderRadius: 10, fontSize: 12.5, fontWeight: active ? 700 : 600,
              cursor: 'pointer', border: 'none', textAlign: 'left',
              background: active ? 'var(--primary-soft)' : 'transparent',
              color: active ? 'var(--primary-deep)' : 'var(--ink-soft)',
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                {icono ? <img src={icono} alt="" style={{ width: 16, height: 16 }} /> : emoji} {label}
              </span>
              <span style={{ opacity: .65, fontWeight: 600 }}>{conteo(key)}</span>
            </button>
          );
        })}
      </div>

      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '.5px', margin: '18px 0 10px' }}>
        Modalidad
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
        {[null, ...MODALIDADES].map(m => {
          const active = modalidad === m;
          return (
            <button key={m ?? 'todas'} onClick={() => onModalidadChange(m)} style={{
              fontSize: 12, fontWeight: active ? 700 : 600,
              padding: '7px 13px', borderRadius: 999, border: 'none', cursor: 'pointer',
              background: active ? 'var(--primary)' : 'var(--surface-2)',
              color: active ? 'var(--primary-ink)' : 'var(--ink-soft)',
            }}>
              {m ?? 'Todas'}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function Profesiones() {
  const [categoriaActiva, setCategoriaActiva] = useState('todos');
  const [busqueda, setBusqueda]               = useState('');
  const [modalidad, setModalidad]             = useState(null);
  const [programas, setProgramas]             = useState([]);
  const [stats, setStats]                     = useState({ total: 0, areas: [] });
  const [cargando, setCargando]               = useState(true);
  const [cargandoMas, setCargandoMas]         = useState(false);
  const [total, setTotal]                     = useState(0);
  const [totalPages, setTotalPages]           = useState(1);
  const [paginaActual, setPaginaActual]       = useState(1);
  const debounceRef = useRef(null);

  useEffect(() => {
    obtenerEstadisticas().then(res => { if (res.success) setStats(res); });
  }, []);

  const cargarProgramas = useCallback(async (area, search, page, append = false) => {
    if (!append) setCargando(true);
    else setCargandoMas(true);

    const res = await obtenerProgramas({ area, search, page, limit: 24 });
    if (res.success) {
      setProgramas(prev => append ? [...prev, ...res.data] : res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    }
    setCargando(false);
    setCargandoMas(false);
  }, []);

  useEffect(() => {
    setPaginaActual(1);
    clearTimeout(debounceRef.current);
    const delay = busqueda ? 350 : 0;
    debounceRef.current = setTimeout(() => {
      cargarProgramas(categoriaActiva, busqueda, 1, false);
    }, delay);
    return () => clearTimeout(debounceRef.current);
  }, [categoriaActiva, busqueda, cargarProgramas]);

  const handleCargarMas = () => {
    const next = paginaActual + 1;
    setPaginaActual(next);
    cargarProgramas(categoriaActiva, busqueda, next, true);
  };

  const handleLimpiar = () => {
    setBusqueda('');
    setCategoriaActiva('todos');
    setModalidad(null);
  };

  const catActual = CAT_MAP[categoriaActiva];

  // Filtro de modalidad en cliente (complementario)
  const programasFiltrados = modalidad
    ? programas.filter(p => p.modalidad === modalidad)
    : programas;

  return (
    <DashboardLayout>
      <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* ── Hero banner ────────────────────────────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(120deg, var(--primary-deep), var(--primary))',
          borderRadius: 22, padding: '24px 28px', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 24, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ flex: 1, zIndex: 1 }}>
            <div className="font-display" style={{ fontWeight: 800, fontSize: 25 }}>
              Explora tu futuro profesional
            </div>
            <div style={{ fontSize: 13.5, opacity: .92, marginTop: 4 }}>
              Programas registrados en el SNIES · 🇨🇴 Todo el país
            </div>
            {/* Search dentro del hero */}
            <div style={{
              background: 'var(--surface)', borderRadius: 14, padding: '13px 18px',
              marginTop: 16, display: 'flex', alignItems: 'center', gap: 12,
              maxWidth: 560, boxShadow: '0 8px 20px rgba(0,0,0,.15)',
            }}>
              <span style={{ fontSize: 17 }}>🔍</span>
              <input
                type="text"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre de programa o institución…"
                style={{
                  flex: 1, border: 'none', outline: 'none',
                  fontSize: 14, color: 'var(--ink)', background: 'transparent', fontFamily: 'inherit',
                }}
              />
              {busqueda && (
                <button onClick={() => setBusqueda('')} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 18, color: '#8A8B82', lineHeight: 1,
                }}>×</button>
              )}
            </div>
          </div>

          {/* Counter */}
          {stats.total > 0 && (
            <div style={{ textAlign: 'center', zIndex: 1, flexShrink: 0 }}>
              <div className="font-display" style={{ fontWeight: 800, fontSize: 40, lineHeight: 1 }}>
                {stats.total.toLocaleString('es-CO')}
              </div>
              <div style={{ fontSize: 12, opacity: .92 }}>programas disponibles</div>
            </div>
          )}

          {/* BG decoration */}
          <svg width="160" height="160" viewBox="0 0 32 32" fill="none" style={{ position: 'absolute', right: 180, bottom: -40, opacity: .12 }}>
            <path d="M16 31 V13" stroke="#fff" strokeWidth="2.6"/>
            <path d="M16 17 C16 9 8 6 3 6.5 C3 15 9 18 16 18 Z" fill="#fff"/>
            <path d="M16 15 C16 7 24 4 29 5 C28 14 23 17 16 17 Z" fill="#fff"/>
          </svg>
        </div>

        {/* ── Grid: results + sidebar ─────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>

          {/* Resultados */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            {/* Sub-header */}
            {!cargando && (
              <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
                <b style={{ color: 'var(--ink)' }}>{total.toLocaleString('es-CO')} programas</b>
                {' '}en {catActual?.label ?? 'todas las áreas'}
                {busqueda ? ` · "${busqueda}"` : ''}
              </div>
            )}

            {/* Grid de cards */}
            {cargando ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : programasFiltrados.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--ink-soft)' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>No hay programas que coincidan.</div>
                <button onClick={handleLimpiar} style={{
                  marginTop: 12, fontSize: 13, color: 'var(--primary)', fontWeight: 700,
                  background: 'none', border: 'none', cursor: 'pointer',
                }}>
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignContent: 'start' }}>
                  {programasFiltrados.map(p => <ProgramaCard key={p.id} programa={p} />)}
                </div>

                {/* Cargar más */}
                {paginaActual < totalPages && (
                  <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                      Mostrando {programas.length.toLocaleString('es-CO')} de {total.toLocaleString('es-CO')}
                    </div>
                    <button onClick={handleCargarMas} disabled={cargandoMas} style={{
                      padding: '11px 24px', fontSize: 13, fontWeight: 700,
                      borderRadius: 13, border: '1px solid var(--line)',
                      background: 'var(--surface)', color: 'var(--ink)',
                      cursor: cargandoMas ? 'not-allowed' : 'pointer',
                      opacity: cargandoMas ? .6 : 1,
                    }}>
                      {cargandoMas ? 'Cargando…' : 'Cargar más programas ↓'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar de filtros */}
          <FilterSidebar
            categoriaActiva={categoriaActiva}
            onCategoriaChange={key => { setBusqueda(''); setCategoriaActiva(key); }}
            modalidad={modalidad}
            onModalidadChange={setModalidad}
            stats={stats}
            onLimpiar={handleLimpiar}
          />
        </div>

        {/* ── Footer informativo ────────────────────────────────────────────── */}
        <div style={{
          background: 'var(--primary-soft)', border: '1px solid var(--line)',
          borderRadius: 18, padding: '16px 20px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 22, flexShrink: 0 }}>🇨🇴</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary-deep)' }}>
              Datos oficiales del Ministerio de Educación Nacional
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 2 }}>
              Programas activos del SNIES · fuente: datos.gov.co · licencia CC-BY-SA 4.0
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
