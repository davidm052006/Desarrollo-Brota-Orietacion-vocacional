import { useState } from 'react';
import { Spinner } from './primitivos';
import { TIPO_COLOR, CONV_FILTERS } from './constantes';

// Pestaña "Convocatorias": filtro por tipo + listado. El filtro es estado
// local porque no afecta a ninguna otra pestaña ni se persiste.
export default function Convocatorias({ data, cargando, onVerMas }) {
  const [filtroActivo, setFiltroActivo] = useState('Todas');
  if (cargando) return <Spinner />;

  const filtradas = filtroActivo === 'Todas' ? data : data.filter(c => c.type === filtroActivo);

  return (
    <>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {CONV_FILTERS.map(f => {
          const active = filtroActivo === f;
          return (
            <button key={f} onClick={() => setFiltroActivo(f)} style={{
              fontSize: 12.5, fontWeight: active ? 700 : 600, padding: '8px 15px', borderRadius: 999,
              border: active ? 'none' : '1px solid var(--line)',
              background: active ? 'var(--primary)' : 'var(--surface)',
              color: active ? 'var(--primary-ink)' : 'var(--ink-soft)',
              cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
            }}>{f}</button>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtradas.map(c => {
          const { color = '#16A34A', bg = '#dcfce7' } = TIPO_COLOR[c.type] ?? {};
          return (
            <div key={c.id} style={{
              background: 'var(--surface)', border: '1px solid var(--line)',
              borderRadius: 12, padding: '16px 18px', borderLeft: `4px solid ${color}`,
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
                  <span style={{ background: bg, color, fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '.4px' }}>
                    {c.type}
                  </span>
                  <span style={{ fontSize: 11.5, fontWeight: c.days < 7 ? 800 : 600, color: c.days < 7 ? '#dc2626' : 'var(--ink-soft)' }}>
                    ⏳ Cierra en {c.days} días
                  </span>
                </div>
                <div className="font-display" style={{ fontWeight: 700, fontSize: 15.5, marginTop: 9, lineHeight: 1.25 }}>
                  {c.title}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 4 }}>
                  🏛️ {c.inst} · 📍 {c.city}
                </div>
              </div>
              <button onClick={() => onVerMas(c)} style={{
                background: 'var(--primary-soft)', color: 'var(--primary-deep)',
                fontWeight: 700, fontSize: 13, padding: '9px 15px',
                borderRadius: 9, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit',
              }}>Ver más →</button>
            </div>
          );
        })}
        {filtradas.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--ink-soft)' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>📭</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>No hay convocatorias en esta categoría.</div>
          </div>
        )}
      </div>
    </>
  );
}
