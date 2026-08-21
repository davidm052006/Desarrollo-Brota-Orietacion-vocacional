import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../config/supabase';
import { obtenerCuestionario, guardarResultado, obtenerResultado, eliminarResultado } from '../../../services/perfilService';
import DashboardLayout from '../../../components/Layout/DashboardLayout';
import TestIntro    from './components/TestIntro';
import TestQuestion from './components/TestQuestion';
import TestProgress from './components/TestProgress';
import TestResult   from './components/TestResult';
import { getCategoriaInfo, storageKey } from '../../../utils/vocacionalCategorias';
import { normalizarCategoria } from '../../../utils/areaColors';

// Calcula el perfil localmente usando los pesos ya cargados en las preguntas.
// Se usa como respaldo cuando el backend no está disponible o el usuario es anónimo.
function calcularPerfilLocal(preguntas, seleccionadas) {
  const acumulado = {};
  preguntas.forEach(pregunta => {
    const elegidas = seleccionadas[pregunta.id] ?? [];
    elegidas.forEach(opcionId => {
      const opcion = pregunta.opciones?.find(o => o.id === opcionId);
      if (!opcion?.pesos) return;
      Object.entries(opcion.pesos).forEach(([cat, pts]) => {
        acumulado[cat] = (acumulado[cat] ?? 0) + pts;
      });
    });
  });
  const ordenados = Object.entries(acumulado).sort(([, a], [, b]) => b - a);
  const maxPts = ordenados[0]?.[1] ?? 1;
  return {
    categoriaPrincipal:  ordenados[0]?.[0] ?? null,
    categoriaSecundaria: ordenados[1]?.[0] ?? null,
    scores: ordenados.map(([categoria, puntos]) => ({
      categoria,
      puntos,
      porcentaje: Math.round((puntos / maxPts) * 100),
    })),
  };
}

function calcToUI(perfilVocacional) {
  if (!perfilVocacional) return null;
  const principal  = getCategoriaInfo(perfilVocacional.categoriaPrincipal, 0);
  const secundaria = perfilVocacional.categoriaSecundaria
    ? getCategoriaInfo(perfilVocacional.categoriaSecundaria, 1)
    : null;
  const scores = (perfilVocacional.scores ?? []).slice(0, 5).map(({ categoria, porcentaje }, i) => ({
    clave:     normalizarCategoria(categoria),
    categoria: getCategoriaInfo(categoria, i).titulo,
    porcentaje,
    emoji:     getCategoriaInfo(categoria, i).emoji,
  }));
  return {
    perfilPrincipal: { ...principal, clave: normalizarCategoria(perfilVocacional.categoriaPrincipal) },
    perfilSecundario: secundaria,
    scores,
  };
}

// ── Progress band (full-width bar below TopNavbar) ────────────────────────────
function ProgressBand({ preguntaIdx, totalPreguntas, onSalir }) {
  const segs = Array.from({ length: totalPreguntas }, (_, i) => i < preguntaIdx + 1);
  const minRestantes = Math.max(1, Math.round(((totalPreguntas - preguntaIdx) / totalPreguntas) * 6));

  return (
    <div style={{
      background: 'var(--surface)', borderBottom: '1px solid var(--line)',
      padding: '14px 28px', display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0,
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
        Pregunta <span style={{ color: 'var(--primary)' }}>{preguntaIdx + 1}</span> / {totalPreguntas}
      </div>
      <div style={{ flex: 1, display: 'flex', gap: 3 }}>
        {segs.map((done, i) => (
          <span key={i} style={{
            flex: 1, height: 7, borderRadius: 999,
            background: done ? 'var(--primary)' : 'var(--surface-2)',
            transition: 'background .3s',
          }} />
        ))}
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', whiteSpace: 'nowrap' }}>
        ⏱ ~{minRestantes} min restantes
      </div>
      <button onClick={onSalir} style={{
        background: 'var(--surface-2)', border: '1px solid var(--line)',
        borderRadius: 999, padding: '7px 15px', fontSize: 12.5, fontWeight: 600,
        cursor: 'pointer', whiteSpace: 'nowrap', color: 'var(--ink)', fontFamily: 'inherit',
      }}>
        Salir ✕
      </button>
    </div>
  );
}

export default function TestVocacional({ user, isDemoMode = false }) {
  const navigate = useNavigate();

  const [fase, setFase]                         = useState('intro');
  const [preguntaIdx, setPreguntaIdx]           = useState(0);
  const [seleccionadas, setSeleccionadas]       = useState({});
  const [preguntas, setPreguntas]               = useState([]);
  const [cuestionarioId, setCuestionarioId]     = useState(null);
  const [cargando, setCargando]                 = useState(true);
  const [errorCarga, setErrorCarga]             = useState(null);
  const [resultado, setResultado]               = useState(null);
  const [resultadoId, setResultadoId]           = useState(null);
  const [perfilUsuarioId, setPerfilUsuarioId]   = useState(null);
  const [guardando, setGuardando]               = useState(false);

  const [tieneBorrador, setTieneBorrador]               = useState(false);
  const [tieneResultadoPrevio, setTieneResultadoPrevio] = useState(false);
  const [resultadoGuardadoDB, setResultadoGuardadoDB]   = useState(null);

  const totalPreguntas = preguntas.length;
  const preguntaActual = preguntas[preguntaIdx];
  const progreso       = totalPreguntas > 0 ? Math.round((preguntaIdx / totalPreguntas) * 100) : 0;
  const idsActuales    = seleccionadas[preguntaActual?.id] ?? [];
  const puedeAvanzar   = idsActuales.length > 0;

  // ── Inicialización ────────────────────────────────────────────────────────────
  useEffect(() => {
    const inicializar = async () => {
      try {
        let pUid = null;
        if (!isDemoMode && user?.id) {
          let { data: perfil, error: errorPerfil } = await supabase
            .from('perfiles_usuario')
            .select('id')
            .eq('user_id', user.id)
            .single();

          if (errorPerfil || !perfil) {
            const { data: perfilNuevo } = await supabase
              .from('perfiles_usuario')
              .insert({ user_id: user.id })
              .select('id')
              .single();
            perfil = perfilNuevo;
          }

          if (perfil) { setPerfilUsuarioId(perfil.id); pUid = perfil.id; }
        }

        const { success, data, error } = await obtenerCuestionario();
        if (!success) { setErrorCarga(error ?? 'No se pudo cargar el cuestionario.'); return; }

        const pregs = data.preguntas ?? [];
        const cId   = data.cuestionario?.id ?? data.id ?? null;
        setPreguntas(pregs);
        setCuestionarioId(cId);

        if (user?.id) {
          try {
            const raw = localStorage.getItem(storageKey(user.id));
            if (raw) {
              const draft = JSON.parse(raw);
              if (draft.cuestionarioId === cId && Object.keys(draft.seleccionadas ?? {}).length > 0) {
                setTieneBorrador(true);
              } else {
                localStorage.removeItem(storageKey(user.id));
              }
            }
          } catch { localStorage.removeItem(storageKey(user.id)); }
        }

        if (pUid) {
          try {
            const { data: resPrevio } = await obtenerResultado(pUid);
            if (resPrevio) {
              const pv = resPrevio.perfil_vocacional ?? {};
              const scores = pv.scores ?? pv.perfil?.scores ?? [];
              const cat = pv.categoriaPrincipal ?? pv.perfil?.categoriaPrincipal;
              // Ignorar resultados vacíos (bug de versión anterior con IDs likert incorrectos)
              if (cat && scores.length > 0) {
                setResultadoGuardadoDB(resPrevio);
                setTieneResultadoPrevio(true);
              }
            }
          } catch { /* no bloquea */ }
        }
      } catch (err) {
        console.error('TestVocacional init:', err);
        setErrorCarga('Error al cargar el test.');
      } finally {
        setCargando(false);
      }
    };
    inicializar();
  }, [user?.id, isDemoMode]);

  // ── Autosave borrador ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (fase !== 'test' || !user?.id || !cuestionarioId) return;
    localStorage.setItem(storageKey(user.id), JSON.stringify({
      cuestionarioId, preguntaIdx, seleccionadas, savedAt: Date.now(),
    }));
  }, [fase, preguntaIdx, seleccionadas, cuestionarioId, user?.id]);

  // ── Handlers del intro ────────────────────────────────────────────────────────
  const continuarBorrador = () => {
    if (!user?.id) return;
    try {
      const raw = localStorage.getItem(storageKey(user.id));
      if (!raw) return;
      const draft = JSON.parse(raw);
      setPreguntaIdx(draft.preguntaIdx ?? 0);
      setSeleccionadas(draft.seleccionadas ?? {});
    } catch {}
    setFase('test');
  };

  const empezarNuevo = () => {
    if (user?.id) localStorage.removeItem(storageKey(user.id));
    setPreguntaIdx(0);
    setSeleccionadas({});
    setFase('test');
  };

  const verResultadoPrevio = () => {
    if (!resultadoGuardadoDB) return;
    const pfVoc = resultadoGuardadoDB.perfil_vocacional;
    setResultado(calcToUI({
      categoriaPrincipal:  pfVoc?.categoriaPrincipal  ?? pfVoc?.perfil?.categoriaPrincipal,
      categoriaSecundaria: pfVoc?.categoriaSecundaria ?? pfVoc?.perfil?.categoriaSecundaria,
      scores:              pfVoc?.scores              ?? pfVoc?.perfil?.scores ?? [],
    }));
    setResultadoId(resultadoGuardadoDB.id ?? null);
    setFase('resultado');
  };

  // ── Navegación entre preguntas ────────────────────────────────────────────────
  const toggleOpcion = (opcionId) => {
    const pregId = preguntaActual.id;
    const tipo   = preguntaActual.tipo;
    setSeleccionadas((prev) => {
      const actuales = prev[pregId] ?? [];
      if (tipo === 'single' || tipo === 'likert') return { ...prev, [pregId]: [opcionId] };
      return {
        ...prev,
        [pregId]: actuales.includes(opcionId)
          ? actuales.filter(id => id !== opcionId)
          : [...actuales, opcionId],
      };
    });
  };

  const irAnterior = () => { if (preguntaIdx > 0) setPreguntaIdx(i => i - 1); };

  const irSiguiente = async () => {
    if (preguntaIdx < totalPreguntas - 1) { setPreguntaIdx(i => i + 1); return; }
    setFase('calculando');
    setGuardando(true);

    // Cálculo local siempre disponible como respaldo
    const perfilLocal = calcularPerfilLocal(preguntas, seleccionadas);

    try {
      if (perfilUsuarioId && cuestionarioId) {
        const res = await guardarResultado(perfilUsuarioId, cuestionarioId, seleccionadas);
        if (res.success && res.data) {
          setResultado(calcToUI(res.data.perfil_vocacional));
          setResultadoId(res.data.id);
        } else {
          // Backend falló: mostrar resultado calculado localmente
          console.warn('guardarResultado falló:', res.error);
          setResultado(calcToUI(perfilLocal));
        }
      } else {
        // Modo demo o sin perfil: calcular en cliente
        setResultado(calcToUI(perfilLocal));
      }
    } catch (err) {
      console.error('Error al guardar resultado:', err);
      setResultado(calcToUI(perfilLocal));
    } finally {
      setGuardando(false);
      setFase('resultado');
      if (user?.id) localStorage.removeItem(storageKey(user.id));
    }
  };

  const reiniciarTest = async () => {
    if (perfilUsuarioId) await eliminarResultado(perfilUsuarioId);
    if (user?.id) localStorage.removeItem(storageKey(user.id));
    setFase('intro');
    setPreguntaIdx(0);
    setSeleccionadas({});
    setResultado(null);
    setResultadoId(null);
    setTieneBorrador(false);
    setTieneResultadoPrevio(false);
    setResultadoGuardadoDB(null);
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout isDemoMode={isDemoMode}>

      {/* Progress band — only during test */}
      {fase === 'test' && totalPreguntas > 0 && (
        <ProgressBand
          preguntaIdx={preguntaIdx}
          totalPreguntas={totalPreguntas}
          onSalir={() => navigate('/dashboard')}
        />
      )}

      {/* Error */}
      {errorCarga && (
        <div style={{
          margin: '24px 28px', background: 'var(--accent-soft)', border: '1px solid var(--line)',
          color: 'var(--accent)', borderRadius: 16, padding: '16px 20px', fontSize: 14, textAlign: 'center',
        }}>
          {errorCarga}
        </div>
      )}

      {/* Intro */}
      {fase === 'intro' && !errorCarga && (
        <TestIntro
          onStart={empezarNuevo}
          onContinuar={continuarBorrador}
          onVerResultado={verResultadoPrevio}
          loading={cargando}
          totalPreguntas={totalPreguntas}
          tieneBorrador={tieneBorrador}
          tieneResultado={tieneResultadoPrevio}
        />
      )}

      {/* Test */}
      {fase === 'test' && preguntaActual && (
        <div style={{
          padding: '26px 28px', display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 18,
        }}>
          {/* Centered question card */}
          <div style={{ width: '100%', maxWidth: 860 }}>
            <TestQuestion
              pregunta={preguntaActual}
              preguntaNumero={preguntaIdx + 1}
              totalPreguntas={totalPreguntas}
              seleccionadas={idsActuales}
              onSeleccionar={toggleOpcion}
              onAnterior={irAnterior}
              onSiguiente={irSiguiente}
              puedeAvanzar={puedeAvanzar}
              guardando={guardando}
              esUltima={preguntaIdx === totalPreguntas - 1}
            />
          </div>
          {/* Helper row */}
          <div style={{ width: '100%', maxWidth: 860 }}>
            <TestProgress
              preguntaActual={preguntaIdx}
              totalPreguntas={totalPreguntas}
              progreso={progreso}
            />
          </div>
        </div>
      )}

      {/* Calculando */}
      {fase === 'calculando' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="animate-spin" style={{
              width: 40, height: 40, border: '3px solid var(--line)',
              borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 16px',
            }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>Analizando tus respuestas...</div>
            <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 4 }}>Esto solo toma un momento</div>
          </div>
        </div>
      )}

      {/* Resultado */}
      {fase === 'resultado' && resultado && (
        <div style={{ padding: '24px 28px' }}>
          <TestResult
            resultadoId={resultadoId}
            perfilPrincipal={resultado.perfilPrincipal}
            perfilSecundario={resultado.perfilSecundario}
            scores={resultado.scores}
            onVerRutas={() => navigate('/dashboard/rutas')}
            onReiniciar={reiniciarTest}
          />
        </div>
      )}

    </DashboardLayout>
  );
}
