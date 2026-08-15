import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import { getAreasDisponibles, getRutaPorArea } from '../../services/rutasService';

// Mismas 14 claves que area_academica en programas/CATEGORIAS de
// Profesiones.jsx — solo etiquetas, el contenido vive en contenido_rutas
// (backend/scripts/migration_rutas.sql, estático, sin llamadas a ningún
// LLM en tiempo real).
const AREA_LABELS = {
  tecnologia: 'Tecnología', salud: 'Salud', ciencias: 'Ciencias', diseño: 'Diseño',
  arte: 'Arte', educacion: 'Educación', social: 'Ciencias Sociales', comunicacion: 'Comunicación',
  juridico: 'Derecho', negocios: 'Negocios', administrativo: 'Administración',
  humanidades: 'Humanidades', ambiental: 'Ambiental', deporte: 'Deportes',
};

function Seccion({ titulo, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 10 }}>
        {titulo}
      </div>
      {children}
    </div>
  );
}

export default function Rutas({ isDemoMode = false }) {
  const [areas, setAreas] = useState([]);
  const [areaActiva, setAreaActiva] = useState(null);
  const [contenido, setContenido] = useState(null);
  const [cargandoAreas, setCargandoAreas] = useState(true);
  const [cargandoContenido, setCargandoContenido] = useState(false);

  useEffect(() => {
    getAreasDisponibles().then(({ success, data }) => {
      if (success) setAreas(data);
      setCargandoAreas(false);
    });
  }, []);

  useEffect(() => {
    if (!areaActiva) return;
    setCargandoContenido(true);
    getRutaPorArea(areaActiva).then(({ success, data }) => {
      if (success) setContenido(data);
      setCargandoContenido(false);
    });
  }, [areaActiva]);

  return (
    <DashboardLayout isDemoMode={isDemoMode}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '28px 28px 60px' }}>
        <h1 className="font-display" style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>
          Rutas formativas
        </h1>
        <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', marginBottom: 22 }}>
          Elegí un área para ver qué te conviene estudiar antes de entrar, proyectos para practicar y recursos para arrancar.
        </p>

        {cargandoAreas ? (
          <p style={{ color: 'var(--ink-soft)', fontSize: 14 }} className="animate-pulse">Cargando…</p>
        ) : (
          <>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 26 }}>
              {areas.map(area => {
                const activa = area === areaActiva;
                return (
                  <button
                    key={area}
                    onClick={() => setAreaActiva(area)}
                    style={{
                      padding: '8px 16px', borderRadius: 999, fontSize: 13, fontWeight: 700,
                      border: activa ? 'none' : '1px solid var(--line)',
                      background: activa ? 'var(--primary)' : 'var(--surface)',
                      color: activa ? 'var(--primary-ink)' : 'var(--ink)',
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    {AREA_LABELS[area] || area}
                  </button>
                );
              })}
            </div>

            {!areaActiva && (
              <div style={{
                background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 20,
                padding: '40px 26px', textAlign: 'center', color: 'var(--ink-soft)', fontSize: 13.5,
              }}>
                Elegí un área arriba para ver su ruta.
              </div>
            )}

            {areaActiva && cargandoContenido && (
              <p style={{ color: 'var(--ink-soft)', fontSize: 14 }} className="animate-pulse">Cargando…</p>
            )}

            {areaActiva && !cargandoContenido && contenido && (
              <div style={{
                background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 20,
                padding: '24px 26px',
              }}>
                <Seccion titulo="Qué estudiar antes de entrar">
                  <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {contenido.temasPrevios.map((t, i) => (
                      <li key={i} style={{ fontSize: 13.5, color: 'var(--ink)' }}>{t}</li>
                    ))}
                  </ul>
                </Seccion>

                <Seccion titulo="Proyectos para practicar">
                  <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {contenido.proyectos.map((p, i) => (
                      <li key={i} style={{ fontSize: 13.5, color: 'var(--ink)' }}>{p}</li>
                    ))}
                  </ul>
                </Seccion>

                <Seccion titulo="Para arrancar a buscar">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {contenido.recursos.map((r, i) => (
                      <a
                        key={i}
                        href={r.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: 13.5, color: 'var(--primary-deep)', textDecoration: 'none',
                          background: 'var(--primary-soft)', padding: '9px 14px', borderRadius: 10,
                          fontWeight: 600,
                        }}
                      >
                        {r.titulo} →
                      </a>
                    ))}
                  </div>
                </Seccion>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
