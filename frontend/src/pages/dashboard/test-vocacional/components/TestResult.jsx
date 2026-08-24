// Conectado a Supabase via perfilService — carga recomendaciones reales.
import { useEffect, useRef, useState } from 'react';
import {
  Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { obtenerRecomendaciones, marcarRecomendacionVista } from '../../../../services/perfilService';
import { getAreaChartColor, getCssVar } from '../../../../utils/areaColors';
import { exportarElementoAPDF } from '../../../../utils/exportarPDF';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

// Los títulos de categoría son largos ("Tecnología e Innovación", "Diseño y
// Comunicación Visual"...) y Chart.js no los envuelve solo — sin esto se
// cortan contra el borde del contenedor. Chart.js sí soporta un label como
// array de strings (una línea por elemento), por eso se devuelve así.
function wrapLabel(str, maxChars = 14) {
  const palabras = str.split(' ');
  const lineas = [];
  let actual = '';
  for (const palabra of palabras) {
    const candidata = actual ? `${actual} ${palabra}` : palabra;
    if (candidata.length > maxChars && actual) {
      lineas.push(actual);
      actual = palabra;
    } else {
      actual = candidata;
    }
  }
  if (actual) lineas.push(actual);
  return lineas;
}

const AREA_INFO = {
  tecnologia:     { label: 'Tecnología',        emoji: '💻', icono: '/icons/icon-categoria-tecnologia.svg' },
  salud:          { label: 'Salud',             emoji: '🏥', icono: '/icons/icon-categoria-salud.svg' },
  ciencias:       { label: 'Ciencias',          emoji: '🔬', icono: '/icons/icon-categoria-ciencias.svg' },
  diseño:         { label: 'Diseño',            emoji: '🎨' },
  arte:           { label: 'Arte',              emoji: '🎭', icono: '/icons/icon-categoria-arte.svg' },
  educacion:      { label: 'Educación',         emoji: '📚' },
  social:         { label: 'Ciencias Sociales', emoji: '🤝' },
  comunicacion:   { label: 'Comunicación',      emoji: '📡' },
  juridico:       { label: 'Derecho',           emoji: '⚖️' },
  negocios:       { label: 'Negocios',          emoji: '📈', icono: '/icons/icon-negocios.svg' },
  administrativo: { label: 'Administración',    emoji: '🏢' },
  humanidades:    { label: 'Humanidades',       emoji: '📖' },
  ambiental:      { label: 'Ambiental',         emoji: '🌿' },
  deporte:        { label: 'Deportes',          emoji: '⚽' },
};

function ProgramaCard({ rec, onVer }) {
  const pct = rec.compatibilidad;
  const areaInfo = AREA_INFO[rec.area] ?? null;
  const compatColor = pct >= 85 ? 'var(--primary)' : pct >= 70 ? '#4A90D9' : 'var(--ink-soft)';
  const compatBg    = pct >= 85 ? 'var(--primary-soft)' : pct >= 70 ? '#E8F0FC' : 'var(--surface-2)';

  return (
    <div
      onClick={() => onVer(rec)}
      style={{
        border: '1px solid var(--line)', borderRadius: 16, padding: 16,
        background: 'var(--surface)', cursor: 'pointer', transition: 'all .15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = ''; }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
        <div className="font-display" style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.2, flex: 1 }}>
          {rec.nombre}
        </div>
        <span style={{
          fontSize: 11, padding: '2px 8px', borderRadius: 999, flexShrink: 0,
          fontWeight: 700, background: compatBg, color: compatColor,
        }}>
          {pct}%
        </span>
      </div>

      {rec.descripcion && (
        <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginBottom: 8, lineHeight: 1.4 }}>
          {rec.descripcion}
        </div>
      )}

      <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.3 }}>{rec.institucion}</div>
      {rec.ciudad && (
        <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 2 }}>
          {rec.ciudad}{rec.departamento && rec.departamento !== rec.ciudad ? `, ${rec.departamento}` : ''}
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
        {areaInfo && (
          <span style={{
            fontSize: 11, background: 'var(--primary-soft)', color: 'var(--primary-deep)',
            padding: '2px 8px', borderRadius: 999, fontWeight: 600,
          }}>
            {areaInfo.icono
              ? <img src={areaInfo.icono} alt="" style={{ width: 12, height: 12, verticalAlign: '-1px' }} />
              : areaInfo.emoji} {areaInfo.label}
          </span>
        )}
        {rec.modalidad && (
          <span style={{ fontSize: 11, background: 'var(--surface-2)', color: 'var(--ink-soft)', padding: '2px 8px', borderRadius: 999 }}>
            {rec.modalidad}
          </span>
        )}
        {rec.duracion && (
          <span style={{ fontSize: 11, background: 'var(--surface-2)', color: 'var(--ink-soft)', padding: '2px 8px', borderRadius: 999 }}>
            {rec.duracion}
          </span>
        )}
      </div>
    </div>
  );
}

// El backend guarda `razones` como un string JSON (array de textos cortos,
// las razones que armó el algoritmo de recomendación) — nunca se parseaba
// del lado del frontend, así que nunca se mostraba en ningún lado pese a
// que ya se calculaba y guardaba.
function parseRazones(razones) {
  if (!razones) return [];
  try {
    const parsed = JSON.parse(razones);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatoMoneda(valor) {
  if (valor == null) return null;
  return valor.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
}

const chipStyle = {
  fontSize: 11.5, background: 'var(--surface-2)', color: 'var(--ink-soft)',
  padding: '3px 10px', borderRadius: 999,
};

// Card flotante con el detalle completo de una recomendación — se abre al
// clickear una ProgramaCard. Usa los mismos campos que ya trae
// obtenerRecomendaciones (ver perfilController.obtenerRecomendaciones en el
// backend), ampliado para incluir requisitos/costo del programa y
// tipo/dirección/contacto de la institución.
function ProgramaDetalleModal({ rec, onClose }) {
  const areaInfo = AREA_INFO[rec.area] ?? null;
  const razones = parseRazones(rec.razones);
  const pct = rec.compatibilidad;
  const compatColor = pct >= 85 ? 'var(--primary)' : pct >= 70 ? '#4A90D9' : 'var(--ink-soft)';
  const compatBg    = pct >= 85 ? 'var(--primary-soft)' : pct >= 70 ? '#E8F0FC' : 'var(--surface-2)';

  return (
    <div
      onClick={onClose}
      className="modal-fondo-in"
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20, zIndex: 100,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="modal-card-in"
        style={{
          background: 'var(--surface)', borderRadius: 24, padding: 28,
          maxWidth: 480, width: '100%', maxHeight: '85vh', overflowY: 'auto',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div className="font-display" style={{ fontSize: 19, fontWeight: 800, lineHeight: 1.25 }}>
            {rec.nombre}
          </div>
          <button onClick={onClose} style={{
            background: 'var(--surface-2)', border: 'none', borderRadius: '50%',
            width: 30, height: 30, flexShrink: 0, cursor: 'pointer', fontSize: 15, color: 'var(--ink-soft)',
          }}>✕</button>
        </div>

        <span style={{
          fontSize: 12, padding: '3px 10px', borderRadius: 999, display: 'inline-block',
          fontWeight: 700, background: compatBg, color: compatColor, marginTop: 8,
        }}>
          {pct}% de compatibilidad
        </span>

        <div style={{
          marginTop: 12, padding: '10px 14px', borderRadius: 12,
          background: 'var(--primary-soft)', color: 'var(--primary-deep)',
          fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 8, lineHeight: 1.35,
        }}>
          🎓 <span>Obtendrás el título de: <strong>{rec.nombre}</strong></span>
        </div>

        <div style={{ fontSize: 14, fontWeight: 700, marginTop: 14 }}>{rec.institucion}</div>
        {rec.institucionTipo && (
          <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{rec.institucionTipo}</div>
        )}
        {(rec.ciudad || rec.direccion) && (
          <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 4 }}>
            📍 {rec.direccion ? `${rec.direccion}, ` : ''}{rec.ciudad}
            {rec.departamento && rec.departamento !== rec.ciudad ? `, ${rec.departamento}` : ''}
          </div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
          {areaInfo && (
            <span style={{
              fontSize: 11.5, background: 'var(--primary-soft)', color: 'var(--primary-deep)',
              padding: '3px 10px', borderRadius: 999, fontWeight: 600,
            }}>
              {areaInfo.icono
                ? <img src={areaInfo.icono} alt="" style={{ width: 12, height: 12, verticalAlign: '-1px' }} />
                : areaInfo.emoji} {areaInfo.label}
            </span>
          )}
          {rec.modalidad && <span style={chipStyle}>{rec.modalidad}</span>}
          {rec.duracion && <span style={chipStyle}>{rec.duracion}</span>}
          {rec.costoMatricula != null && <span style={chipStyle}>{formatoMoneda(rec.costoMatricula)} matrícula</span>}
        </div>

        {rec.descripcion && (
          <p style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.5, marginTop: 16 }}>{rec.descripcion}</p>
        )}

        {razones.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>💡 Por qué te lo recomendamos</div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.6, listStyle: 'disc' }}>
              {razones.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        )}

        {rec.requisitos && (
          <div style={{ marginTop: 18 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>📋 Requisitos</div>
            <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.5, margin: 0 }}>{rec.requisitos}</p>
          </div>
        )}

        {(rec.telefono || rec.email || rec.sitioWeb) && (
          <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>Contacto de la institución</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12.5 }}>
              {rec.telefono && <span>📞 {rec.telefono}</span>}
              {rec.email && (
                <a href={`mailto:${rec.email}`} style={{ color: 'var(--primary)' }}>✉️ {rec.email}</a>
              )}
              {rec.sitioWeb && (
                <a href={rec.sitioWeb} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>
                  🔗 {rec.sitioWeb}
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Props:
//   resultadoId      : string (UUID)
//   perfilPrincipal  : { emoji, titulo, descripcion, color }
//   perfilSecundario : { emoji, titulo } | null
//   scores           : [{ categoria, porcentaje, emoji }]
//   onVerRutas, onReiniciar, onVerPrograma : () => void
export default function TestResult({
  resultadoId,
  perfilPrincipal,
  perfilSecundario  = null,
  scores            = [],
  onVerRutas        = () => {},
  onReiniciar       = () => {},
  onVerPrograma     = () => {},
}) {
  const [recomendaciones, setRecomendaciones] = useState([]);
  const [cargando, setCargando]               = useState(!!resultadoId);
  const [error, setError]                     = useState(null);
  const [exportando, setExportando]           = useState(false);
  const [programaAbierto, setProgramaAbierto] = useState(null);
  const exportRef = useRef(null);

  useEffect(() => {
    if (!resultadoId) return;
    let cancelado = false;

    (async () => {
      setCargando(true);
      setError(null);

      const res = await obtenerRecomendaciones(resultadoId);
      if (!cancelado) {
        if (!res.success) setError(res.error);
        else setRecomendaciones(res.data ?? []);
        setCargando(false);
      }
    })();

    return () => { cancelado = true; };
  }, [resultadoId]);

  const handleVerPrograma = async (rec) => {
    setProgramaAbierto(rec);
    if (!rec.vista) {
      await marcarRecomendacionVista(rec.id);
      setRecomendaciones(prev => prev.map(r => r.id === rec.id ? { ...r, vista: true } : r));
    }
    onVerPrograma(rec);
  };

  const perfil = perfilPrincipal ?? { emoji: '🎯', titulo: 'Tu perfil', descripcion: '', clave: null };
  const colorPerfil = getAreaChartColor(perfil.clave);

  const handleExportar = async () => {
    setExportando(true);
    await exportarElementoAPDF(exportRef.current, 'brota-resultado-vocacional.pdf');
    setExportando(false);
  };

  const radarData = {
    labels: scores.map(s => wrapLabel(s.categoria)),
    datasets: [{
      label: 'Tu perfil',
      data: scores.map(s => s.porcentaje),
      backgroundColor: colorPerfil.fill,
      borderColor: colorPerfil.line,
      borderWidth: 2,
      pointBackgroundColor: colorPerfil.line,
    }],
  };
  const radarOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      r: {
        beginAtZero: true, max: 100,
        ticks: { display: false },
        grid: { color: getCssVar('--line', '#E6E4DA') },
        angleLines: { color: getCssVar('--line', '#E6E4DA') },
        pointLabels: { color: getCssVar('--ink-soft', '#67756B'), font: { size: 11 }, padding: 18 },
      },
    },
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>

      <div ref={exportRef} style={{ display: 'flex', flexDirection: 'column', gap: 18, background: 'var(--bg)', padding: 2 }}>

      {/* Perfil principal */}
      <div style={{
        background: colorPerfil.fill, border: '1px solid var(--line)',
        borderRadius: 24, padding: '36px 32px', textAlign: 'center',
      }}>
        <div style={{ fontSize: 52, marginBottom: 14 }}>
          {perfil.icono ? <img src={perfil.icono} alt="" style={{ width: 52, height: 52, margin: '0 auto' }} /> : perfil.emoji}
        </div>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 }}>
          Tu perfil vocacional
        </div>
        <div className="font-display" style={{ fontWeight: 800, fontSize: 26, color: colorPerfil.line, marginBottom: 10 }}>
          {perfil.titulo}
        </div>
        {perfil.descripcion && (
          <div style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.55, maxWidth: 420, margin: '0 auto' }}>
            {perfil.descripcion}
          </div>
        )}
        {perfilSecundario && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 16,
            background: 'var(--surface)', borderRadius: 999, padding: '8px 16px',
            fontSize: 13, color: 'var(--ink-soft)', border: '1px solid var(--line)',
          }}>
            <span>{perfilSecundario.icono ? <img src={perfilSecundario.icono} alt="" style={{ width: 14, height: 14 }} /> : perfilSecundario.emoji}</span>
            <span>Perfil secundario: <b>{perfilSecundario.titulo}</b></span>
          </div>
        )}
      </div>

      {/* Distribución: radar + detalle numérico */}
      {scores.length > 0 && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--line)',
          borderRadius: 20, padding: 24, boxShadow: 'var(--shadow)',
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 18 }}>📊 Distribución de tu perfil</div>

          <div style={{ maxWidth: 480, margin: '0 auto 20px' }}>
            <Radar data={radarData} options={radarOptions} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {scores.map(({ categoria, porcentaje, emoji }, idx) => (
              <div key={categoria} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 16, width: 24, textAlign: 'center' }}>{emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)' }}>{categoria}</span>
                    {idx === 0 && (
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: colorPerfil.line }}>Principal</span>
                    )}
                  </div>
                  <div style={{ height: 8, borderRadius: 999, background: 'var(--surface-2)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 999, background: colorPerfil.line,
                      width: `${porcentaje}%`, transition: 'width .7s ease',
                    }} />
                  </div>
                </div>
                <span style={{ fontSize: 12, color: 'var(--ink-soft)', width: 32, textAlign: 'right' }}>{porcentaje}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      </div>

      <button onClick={handleExportar} disabled={exportando} style={{
        alignSelf: 'center', display: 'flex', alignItems: 'center', gap: 8,
        background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--line)',
        fontWeight: 700, fontSize: 13, padding: '10px 20px', borderRadius: 999,
        cursor: 'pointer', fontFamily: 'inherit', opacity: exportando ? .6 : 1,
      }}>
        {exportando ? (
          <><span className="animate-spin" style={{ width: 14, height: 14, border: '2px solid var(--line)', borderTopColor: 'var(--ink)', borderRadius: '50%' }} /> Generando PDF...</>
        ) : <>⬇ Descargar resultado en PDF</>}
      </button>

      {/* Recomendaciones */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--line)',
        borderRadius: 20, padding: 24, boxShadow: 'var(--shadow)',
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>🎓 Programas recomendados para ti</div>

        {cargando && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ink-soft)', marginBottom: 14 }}>
              <div className="animate-spin" style={{ width: 16, height: 16, border: '2px solid var(--line)', borderTopColor: 'var(--primary)', borderRadius: '50%' }} />
              Buscando programas para tu perfil...
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[1,2,3,4].map(i => (
                <div key={i} className="animate-pulse" style={{ height: 110, borderRadius: 16, background: 'var(--surface-2)' }} />
              ))}
            </div>
          </div>
        )}

        {!cargando && error && (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 10 }}>
              No pudimos cargar los programas en este momento.
            </div>
            <button onClick={() => {
              setError(null); setCargando(true);
              obtenerRecomendaciones(resultadoId).then(res => {
                if (res.success) setRecomendaciones(res.data);
                else setError(res.error);
                setCargando(false);
              });
            }} style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>
              Reintentar
            </button>
          </div>
        )}

        {!cargando && !error && recomendaciones.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--ink-soft)' }}>
            <div style={{ fontSize: 30, marginBottom: 10 }}>📭</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>No encontramos programas para tu perfil.</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Intenta explorar la sección de Profesiones.</div>
          </div>
        )}

        {!cargando && !error && recomendaciones.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {recomendaciones.map(rec => (
              <ProgramaCard key={rec.id} rec={rec} onVer={handleVerPrograma} />
            ))}
          </div>
        )}
      </div>

      {/* Acciones */}
      <div style={{ display: 'flex', gap: 12, paddingBottom: 16 }}>
        <button onClick={onVerRutas} style={{
          flex: 1, background: 'var(--primary)', color: 'var(--primary-ink)',
          fontWeight: 700, fontSize: 14, padding: '14px', borderRadius: 16, border: 'none',
          cursor: 'pointer', boxShadow: '0 8px 20px var(--primary-glow)', fontFamily: 'inherit',
        }}>
          Ver rutas formativas →
        </button>
        <button onClick={onReiniciar} style={{
          flex: 1, background: 'var(--surface-2)', color: 'var(--ink-soft)',
          fontWeight: 600, fontSize: 13, padding: '14px', borderRadius: 16,
          border: '1px solid var(--line)', cursor: 'pointer', fontFamily: 'inherit',
        }}>
          ↺ Volver a hacer el test
        </button>
      </div>

      {programaAbierto && (
        <ProgramaDetalleModal rec={programaAbierto} onClose={() => setProgramaAbierto(null)} />
      )}

    </div>
  );
}
