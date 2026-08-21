import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerResultado, eliminarResultado } from '../../../services/perfilService';
import { storageKey, getCategoriaInfo } from '../../../utils/vocacionalCategorias';

export default function ContinueSection({ perfilUsuarioId, userId }) {
  const navigate = useNavigate();
  const [estado, setEstado]       = useState('cargando');
  const [progreso, setProgreso]   = useState(0);
  const [perfilLabel, setPerfilLabel] = useState('');
  const [eliminando, setEliminando]   = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  const cargar = async () => {
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
      } catch {}
    }
    if (perfilUsuarioId) {
      try {
        const { data } = await obtenerResultado(perfilUsuarioId);
        if (data) {
          const pfVoc = data.perfil_vocacional;
          const cat   = pfVoc?.categoriaPrincipal ?? pfVoc?.perfil?.categoriaPrincipal ?? '';
          setPerfilLabel(getCategoriaInfo(cat).titulo);
          setProgreso(100);
          setEstado('completado');
          return;
        }
      } catch {}
    }
    setProgreso(0);
    setEstado('nuevo');
  };

  useEffect(() => { cargar(); }, [perfilUsuarioId, userId]);

  const handleEliminar = async () => {
    setEliminando(true);
    if (userId) localStorage.removeItem(storageKey(userId));
    if (perfilUsuarioId) await eliminarResultado(perfilUsuarioId);
    setConfirmando(false);
    setEliminando(false);
    setProgreso(0);
    setEstado('nuevo');
    setPerfilLabel('');
  };

  const textoBoton = { completado: 'Ver resultado →', 'en-progreso': 'Continuar →', nuevo: 'Comenzar →', cargando: '...' }[estado];
  const iconoCard  = { completado: '🎉', 'en-progreso': '📝', nuevo: '🧑‍🎓', cargando: '🌱' }[estado];
  const descripcion = {
    completado:    `Perfil: ${perfilLabel || 'Completado'}`,
    'en-progreso': 'En progreso — continúa donde lo dejaste',
    nuevo:         'Descubre tus intereses y fortalezas',
    cargando:      'Cargando...',
  }[estado];
  const puedeEliminar = estado === 'completado' || estado === 'en-progreso';

  return (
    <div>
        {/* Test vocacional card */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 18,
          padding: 18, boxShadow: 'var(--shadow)', display: 'flex', alignItems: 'center', gap: 15,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, background: 'var(--primary-soft)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0,
          }}>
            {iconoCard}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14.5 }}>Test vocacional</div>
            <div style={{ fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.35, marginTop: 2, marginBottom: 10 }}>
              {descripcion}
            </div>
            {/* Progress bar */}
            <div style={{ height: 7, background: 'var(--surface-2)', borderRadius: 999, overflow: 'hidden', marginBottom: 6 }}>
              <div style={{
                height: '100%', borderRadius: 999,
                background: 'linear-gradient(90deg, var(--primary-deep), var(--primary))',
                width: `${progreso}%`, transition: 'width .5s ease',
              }} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginBottom: 12 }}>{progreso}% completado</div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <button onClick={() => navigate('/dashboard/test')} disabled={estado === 'cargando'} style={{
                background: 'var(--primary)', color: 'var(--primary-ink)',
                fontSize: 12, fontWeight: 700, padding: '8px 16px', borderRadius: 10,
                border: 'none', cursor: estado === 'cargando' ? 'not-allowed' : 'pointer',
                opacity: estado === 'cargando' ? .6 : 1, fontFamily: 'inherit',
              }}>
                {textoBoton}
              </button>

              {puedeEliminar && !confirmando && (
                <button onClick={() => setConfirmando(true)} style={{
                  fontSize: 12, color: 'var(--ink-soft)', background: 'none', border: 'none',
                  cursor: 'pointer', padding: '8px 6px', fontFamily: 'inherit',
                }}>
                  🗑 Eliminar
                </button>
              )}

              {confirmando && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>¿Seguro?</span>
                  <button onClick={handleEliminar} disabled={eliminando} style={{
                    fontSize: 12, background: 'var(--accent)', color: '#fff',
                    padding: '6px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    opacity: eliminando ? .5 : 1, fontFamily: 'inherit',
                  }}>
                    {eliminando ? '...' : 'Sí, borrar'}
                  </button>
                  <button onClick={() => setConfirmando(false)} style={{
                    fontSize: 12, color: 'var(--ink-soft)', background: 'none', border: 'none',
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                    Cancelar
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>
    </div>
  );
}
