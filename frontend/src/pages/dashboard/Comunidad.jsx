import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import { getForos, getHistorias, getPreguntas, getConvocatorias } from '../../services/comunidadService';
import Foros from './comunidad/components/Foros';
import Historias from './comunidad/components/Historias';
import Preguntas from './comunidad/components/Preguntas';
import Convocatorias from './comunidad/components/Convocatorias';
import Sidebar from './comunidad/components/Sidebar';
import ModalCompartirHistoria from './comunidad/components/ModalCompartirHistoria';
import ModalHacerPregunta from './comunidad/components/ModalHacerPregunta';

// Página "Comunidad": pestañas (foros/historias/preguntas/convocatorias) +
// sidebar de contexto. Esta página solo se encarga de:
//   1. cargar los datos de las 4 pestañas,
//   2. controlar qué pestaña y qué modal está activo,
//   3. delegar el render de cada pestaña/modal a su propio componente.
// Toda la UI y las reglas de cada pestaña viven en ./comunidad/components/.

const TABS = [
  { key: 'foros',         label: 'Foros'            },
  { key: 'historias',     label: 'Historias reales'  },
  { key: 'preguntas',     label: 'Preguntas'         },
  { key: 'convocatorias', label: 'Convocatorias'     },
];

export default function Comunidad() {
  const [tabActiva, setTabActiva]         = useState('foros');
  const [modalHistoria, setModalHistoria] = useState(false);
  const [modalPregunta, setModalPregunta] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const [foros,         setForos]         = useState([]);
  const [historias,     setHistorias]     = useState([]);
  const [preguntas,     setPreguntas]     = useState([]);
  const [convocatorias, setConvocatorias] = useState([]);
  const [cargando,      setCargando]      = useState({
    foros: true, historias: true, preguntas: true, convocatorias: true,
  });

  const cargar = useCallback(async () => {
    const [rf, rh, rp, rc] = await Promise.all([
      getForos(), getHistorias(), getPreguntas(), getConvocatorias(),
    ]);
    if (rf.success) setForos(rf.data ?? []);
    if (rh.success) setHistorias(rh.data ?? []);
    if (rp.success) setPreguntas(rp.data ?? []);
    if (rc.success) setConvocatorias(rc.data ?? []);
    setCargando({ foros: false, historias: false, preguntas: false, convocatorias: false });
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    if (location.state?.resetAt) {
      setTabActiva('foros');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location.state?.resetAt]);

  // Llegar desde otra pantalla con una pestaña específica en mente
  // (ej. el feed del Dashboard, cuando el destino no es un detalle real).
  useEffect(() => {
    if (location.state?.tab && TABS.some(t => t.key === location.state.tab)) {
      setTabActiva(location.state.tab);
    }
  }, [location.state?.tab]);

  function handleFAB() {
    if (tabActiva === 'historias') setModalHistoria(true);
    else setModalPregunta(true);
  }

  const fabLabel = tabActiva === 'convocatorias' ? null : tabActiva === 'historias' ? '✍️' : '+';

  return (
    <DashboardLayout>
      <div style={{ padding: '22px 28px 0', background: 'var(--bg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div className="font-display" style={{ fontWeight: 800, fontSize: 26, letterSpacing: '-.6px', margin: 0 }}>
            Comunidad
          </div>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'var(--primary-soft)', color: 'var(--primary-deep)',
            fontSize: 12.5, fontWeight: 700, padding: '6px 13px', borderRadius: 999,
          }}>🌱 Espacio para crecer juntos</span>
        </div>
        <div style={{ fontSize: 13.5, color: 'var(--ink-soft)', marginTop: 7, maxWidth: 560, lineHeight: 1.5 }}>
          Aquí, otros estudiantes ya encontraron su camino. El tuyo también está aquí.
        </div>
        <div style={{
          position: 'sticky', top: 66, zIndex: 5,
          display: 'flex', gap: 6, marginTop: 18, padding: '10px 0',
          background: 'var(--bg)', overflowX: 'auto',
        }}>
          {TABS.map(t => {
            const active = tabActiva === t.key;
            return (
              <button key={t.key} onClick={() => setTabActiva(t.key)} style={{
                fontSize: 13.5, fontWeight: active ? 700 : 600,
                padding: '9px 16px', borderRadius: 999, whiteSpace: 'nowrap',
                border: active ? 'none' : '1px solid var(--line)',
                background: active ? 'var(--primary)' : 'var(--surface)',
                color: active ? 'var(--primary-ink)' : 'var(--ink-soft)',
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
              }}>{t.label}</button>
            );
          })}
        </div>
      </div>

      <div style={{
        display: 'flex', gap: 22, padding: '8px 28px 40px',
        alignItems: 'flex-start', background: 'var(--bg)', minHeight: 'calc(100vh - 200px)',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {tabActiva === 'foros' && (
            <Foros data={foros} cargando={cargando.foros}
              onEntrar={f => navigate(`/dashboard/comunidad/foro/${f.id}`, { state: { foro: f } })}
            />
          )}
          {tabActiva === 'historias' && (
            <Historias data={historias} cargando={cargando.historias}
              onCompartir={() => setModalHistoria(true)}
              onLeer={h => navigate(`/dashboard/comunidad/historia/${h.id}`, { state: { historia: h } })}
              onModerar={cargar}
            />
          )}
          {tabActiva === 'preguntas' && (
            <Preguntas data={preguntas} cargando={cargando.preguntas}
              onPreguntar={() => setModalPregunta(true)}
              onPreguntaClick={q => navigate(`/dashboard/comunidad/post/${q.id}`, { state: { post: q, tipo: 'pregunta' } })}
              onModerar={cargar}
            />
          )}
          {tabActiva === 'convocatorias' && (
            <Convocatorias data={convocatorias} cargando={cargando.convocatorias}
              onVerMas={c => navigate(`/dashboard/comunidad/convocatoria/${c.id}`, { state: { conv: c } })}
            />
          )}
        </div>
        <Sidebar preguntas={preguntas} convocatorias={convocatorias} />
      </div>

      {fabLabel && (
        <button onClick={handleFAB} style={{
          position: 'fixed', bottom: 24, right: 24,
          width: 56, height: 56, borderRadius: '50%',
          background: 'var(--primary)', color: 'var(--primary-ink)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 10px 26px var(--primary-glow)', zIndex: 40,
          border: 'none', fontFamily: 'inherit',
        }}>{fabLabel}</button>
      )}

      {modalHistoria && <ModalCompartirHistoria onClose={() => setModalHistoria(false)} />}
      {modalPregunta && (
        <ModalHacerPregunta
          onClose={() => setModalPregunta(false)}
          onPublicada={() => getPreguntas().then(r => r.success && setPreguntas(r.data ?? []))}
        />
      )}
    </DashboardLayout>
  );
}
