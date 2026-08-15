import { useState, useRef, useEffect } from 'react';

// Dropdown con efecto de vidrio esmerilado (blur + transparencia, estilo
// macOS/iOS) para reemplazar <input type="text"> en campos con opciones
// fijas — el usuario elige en vez de escribir. `options` acepta strings
// o { value, label }.
export default function GlassSelect({ value, onChange, options, placeholder = 'Seleccionar' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function onEscape(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, []);

  const norm = (o) => (typeof o === 'string' ? { value: o, label: o } : o);
  const items = options.map(norm);
  const selected = items.find(o => o.value === value);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '9px 12px', borderRadius: 10, border: '1px solid var(--line)',
          background: 'var(--surface)', color: selected ? 'var(--ink)' : 'var(--ink-soft)',
          fontSize: 13.5, fontFamily: 'inherit', cursor: 'pointer',
        }}
      >
        <span>{selected ? selected.label : placeholder}</span>
        <span style={{
          fontSize: 9, opacity: .6, marginLeft: 8,
          transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s',
        }}>▼</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 30,
          maxHeight: 240, overflowY: 'auto',
          background: 'color-mix(in srgb, var(--surface) 68%, transparent)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid var(--line)', borderRadius: 14,
          boxShadow: 'var(--shadow-md)', padding: 6,
        }}>
          {items.map(({ value: v, label: l }) => {
            const active = v === value;
            return (
              <button
                key={v}
                type="button"
                onClick={() => { onChange(v); setOpen(false); }}
                style={{
                  width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 9,
                  border: 'none', background: active ? 'var(--primary-soft)' : 'transparent',
                  color: active ? 'var(--primary-deep)' : 'var(--ink)', fontWeight: active ? 700 : 500,
                  fontSize: 13, fontFamily: 'inherit', cursor: 'pointer', display: 'block',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--surface-2)'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                {l}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
