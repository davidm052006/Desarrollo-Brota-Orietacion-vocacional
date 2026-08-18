import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import { getAreasDisponibles, getRutaPorArea } from '../../services/rutasService';
import { obtenerPerfil, obtenerResultado } from '../../services/perfilService';

// Mismos 2 alias que backend/src/utils/algoritmoRecomendacion.js — el
// categoriaPrincipal/Secundaria guardado en resultados.perfil_vocacional
// puede venir sin normalizar (bug #1 de CLAUDE.md), así que se aplica el
// mismo mapeo acá para no perder el match contra las claves de área.
const CATEGORIA_ALIAS = { emprendimiento: 'negocios', ambiente: 'ambiental' };
const normalizarCategoria = (c) => CATEGORIA_ALIAS[c] ?? c;

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

function Chip({ area, activa, relacionada, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 16px', borderRadius: 999, fontSize: 13, fontWeight: 700,
        border: activa ? 'none' : `1px solid ${relacionada ? 'var(--primary)' : 'var(--line)'}`,
        background: activa ? 'var(--primary)' : relacionada ? 'var(--primary-soft)' : 'var(--surface)',
        color: activa ? 'var(--primary-ink)' : relacionada ? 'var(--primary-deep)' : 'var(--ink)',
        cursor: 'pointer', fontFamily: 'inherit',
      }}
    >
      {AREA_LABELS[area] || area}
    </button>
  );
}

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

export default function Rutas({ user, isDemoMode = false }) {
  const navigate = useNavigate();
  const [areas, setAreas] = useState([]);
  const [areaActiva, setAreaActiva] = useState(null);
  const [contenido, setContenido] = useState(null);
  const [cargandoAreas, setCargandoAreas] = useState(true);
  const [cargandoContenido, setCargandoContenido] = useState(false);
  const [categoriasResultado, setCategoriasResultado] = useState(null); // null = todavía cargando/sin test; [] no debería pasar si hizo el test

  useEffect(() => {
    getAreasDisponibles().then(({ success, data }) => {
      if (success) setAreas(data);
      setCargandoAreas(false);
    });
  }, []);

  useEffect(() => {
    if (!user?.id) { setCategoriasResultado([]); return; }
    obtenerPerfil(user.id).then(({ success, data: perfil }) => {
      if (!success || !perfil?.id) { setCategoriasResultado([]); return; }
      obtenerResultado(perfil.id).then(({ success: ok, data: resultado }) => {
        if (!ok || !resultado?.perfil_vocacional) { setCategoriasResultado([]); return; }
        const { categoriaPrincipal, categoriaSecundaria } = resultado.perfil_vocacional;
        const cats = [categoriaPrincipal, categoriaSecundaria]
          .filter(Boolean)
          .map(normalizarCategoria);
        setCategoriasResultado(cats);
      });
    });
  }, [user?.id]);

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
            {categoriasResultado === null ? null : categoriasResultado.length === 0 ? (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14,
                background: 'var(--accent-soft)', border: '1px solid var(--accent)', borderRadius: 16,
                padding: '14px 18px', marginBottom: 20,
              }}>
                <p style={{ fontSize: 13, color: 'var(--ink)', margin: 0 }}>
                  Todavía no hiciste el test vocacional — hacelo para que te marquemos acá las áreas más afines a vos.
                </p>
                <button
                  onClick={() => navigate('/dashboard/test')}
                  style={{
                    flexShrink: 0, background: 'var(--accent)', color: '#fff', fontWeight: 700,
                    fontSize: 12.5, padding: '9px 16px', borderRadius: 10, border: 'none',
                    cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                  }}
                >
                  Hacer el test
                </button>
              </div>
            ) : (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary-deep)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 10 }}>
                  Relacionadas con tus resultados
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {areas.filter(a => categoriasResultado.includes(a)).map(area => (
                    <Chip key={area} area={area} activa={area === areaActiva} relacionada onClick={() => setAreaActiva(area)} />
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 26 }}>
              {areas.filter(a => !categoriasResultado?.includes(a)).map(area => (
                <Chip key={area} area={area} activa={area === areaActiva} onClick={() => setAreaActiva(area)} />
              ))}
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
                {contenido.materiasComunes?.length > 0 && (
                  <Seccion titulo="Materias más comunes de la carrera">
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                      {contenido.materiasComunes.map((m, i) => (
                        <span key={i} style={{
                          fontSize: 12.5, fontWeight: 600, color: 'var(--primary-deep)',
                          background: 'var(--primary-soft)', padding: '5px 12px', borderRadius: 999,
                        }}>
                          {m}
                        </span>
                      ))}
                    </div>
                  </Seccion>
                )}

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
