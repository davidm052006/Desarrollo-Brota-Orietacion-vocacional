// Piezas de UI genéricas compartidas por las pestañas y modales de Comunidad.
// Solo componentes en este archivo (ver constantes.js para datos/helpers) —
// así Vite puede aplicar Fast Refresh correctamente.
import { useNavigate } from 'react-router-dom';
import { AREAS_CHIPS } from './constantes';
import { ocultarPublicacion, eliminarPublicacion } from '../../../../services/comunidadService';

const modBtnStyle = {
  fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 8,
  border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink-soft)',
  cursor: 'pointer', fontFamily: 'inherit',
};

// Barra de acciones de moderación (ocultar/eliminar/ver autor real). El
// backend solo manda `autorId` en la respuesta cuando quien pide es
// admin/moderador (ver resolverAutor en comunidadHelpers.js) — si no viene,
// esto no renderiza nada, así que la autorización real vive en el backend,
// no acá. tipo: 'post' | 'historia' | 'pregunta'.
export function ModeracionBar({ tipo, id, autorId, onCambio }) {
  const navigate = useNavigate();
  if (!autorId) return null;

  const parar = (e) => e.stopPropagation();

  const handleOcultar = async (e) => {
    parar(e);
    if (!confirm('¿Ocultar esta publicación? Deja de verse para todos, pero no se borra.')) return;
    const { success } = await ocultarPublicacion(tipo, id);
    if (success) onCambio?.();
  };

  const handleEliminar = async (e) => {
    parar(e);
    if (!confirm('¿Eliminar esta publicación de forma permanente? No se puede deshacer.')) return;
    const { success } = await eliminarPublicacion(tipo, id);
    if (success) onCambio?.();
  };

  const handleAutor = (e) => {
    parar(e);
    navigate(`/dashboard/comunidad/autor/${autorId}`);
  };

  return (
    <div onClick={parar} style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
      <button onClick={handleAutor} style={modBtnStyle}>👤 Ver autor</button>
      <button onClick={handleOcultar} style={modBtnStyle}>🙈 Ocultar</button>
      <button onClick={handleEliminar} style={{ ...modBtnStyle, color: '#dc2626', borderColor: '#fca5a5' }}>🗑 Eliminar</button>
    </div>
  );
}

export function Backdrop({ onClose, children }) {
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 50,
      background: 'rgba(15,31,20,.32)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div onClick={e => e.stopPropagation()}>{children}</div>
    </div>
  );
}

export function Toggle({ value, onChange, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <span style={{ fontSize: 13.5, color: 'var(--ink-soft)', flex: 1 }}>{label}</span>
      <button onClick={() => onChange(!value)} style={{
        width: 44, height: 26, borderRadius: 999,
        background: value ? 'var(--primary)' : 'var(--surface-2)',
        border: 'none', cursor: 'pointer', position: 'relative', transition: 'background .2s',
      }}>
        <span style={{
          position: 'absolute', top: 3, left: value ? 'calc(100% - 22px)' : 3,
          width: 20, height: 20, borderRadius: '50%', background: '#fff',
          transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.18)',
        }} />
      </button>
    </div>
  );
}

export function AreaChips({ value, onChange }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {AREAS_CHIPS.map(a => {
        const active = value === a;
        return (
          <button key={a} onClick={() => onChange(a)} style={{
            fontSize: 12.5, padding: '7px 14px', borderRadius: 999,
            border: active ? 'none' : '1px solid var(--line)',
            background: active ? 'var(--primary)' : 'var(--surface)',
            color: active ? '#fff' : 'var(--ink-soft)',
            fontWeight: active ? 700 : 600, cursor: 'pointer', fontFamily: 'inherit',
          }}>{a}</button>
        );
      })}
    </div>
  );
}

export function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
      <div className="animate-spin" style={{
        width: 32, height: 32, border: '3px solid var(--line)',
        borderTopColor: 'var(--primary)', borderRadius: '50%',
      }} />
    </div>
  );
}
