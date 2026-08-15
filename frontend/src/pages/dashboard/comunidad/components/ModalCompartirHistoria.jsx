import { useState } from 'react';
import { crearHistoria } from '../../../../services/comunidadService';
import { Backdrop, Toggle, AreaChips } from './primitivos';

// Formulario modal para publicar una historia. Maneja su propio estado de
// envío/éxito/error porque no le concierne a nadie más que a este modal.
export default function ModalCompartirHistoria({ onClose }) {
  const [form, setForm] = useState({ titulo: '', area: 'Artes', contenido: '', carrera: '', institucion: '', anonimo: true });
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState(null);

  async function handleEnviar(e) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    const res = await crearHistoria(form);
    setEnviando(false);
    if (res.success) setEnviado(true);
    else setError(res.error || 'Error al enviar. Intenta de nuevo.');
  }

  if (enviado) return (
    <Backdrop onClose={onClose}>
      <div style={{
        background: 'var(--surface)', borderRadius: 20, padding: '48px 40px',
        maxWidth: 500, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,.25)', textAlign: 'center',
      }}>
        <div style={{ fontSize: 44, marginBottom: 16 }}>🌱</div>
        <div className="font-display" style={{ fontWeight: 800, fontSize: 20, marginBottom: 10 }}>
          ¡Gracias por compartir tu historia!
        </div>
        <div style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.6, marginBottom: 28 }}>
          🛡️ Tu historia pasa por revisión antes de publicarse.<br />En menos de 24h estará visible.
        </div>
        <button onClick={onClose} style={{
          background: 'var(--primary)', color: 'var(--primary-ink)',
          fontWeight: 700, fontSize: 14.5, padding: '13px 32px',
          borderRadius: 999, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
        }}>Perfecto</button>
      </div>
    </Backdrop>
  );

  return (
    <Backdrop onClose={onClose}>
      <form onSubmit={handleEnviar} style={{
        background: 'var(--surface)', borderRadius: 20, padding: '28px 32px',
        maxWidth: 620, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,.25)',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div className="font-display" style={{ fontWeight: 800, fontSize: 22, lineHeight: 1.15 }}>
              Comparte tu historia 🌱
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 6 }}>
              Tu experiencia puede orientar a alguien que viene detrás.
            </div>
          </div>
          <button type="button" onClick={onClose} style={{
            width: 34, height: 34, borderRadius: '50%', background: 'var(--surface-2)',
            border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--ink-soft)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>

        {[
          { key: 'titulo', label: 'Título', placeholder: '¿Cómo fue tu camino?' },
          { key: 'carrera', label: 'Carrera', placeholder: 'Ej: Diseño Gráfico (opcional)' },
          { key: 'institucion', label: 'Institución', placeholder: 'Ej: U. Nacional (opcional)' },
        ].map(({ key, label, placeholder }) => (
          <div key={key}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-soft)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.4px' }}>{label}</div>
            <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              placeholder={placeholder} required={key === 'titulo'}
              style={{ width: '100%', boxSizing: 'border-box', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 11, padding: '11px 14px', fontSize: 14, color: 'var(--ink)', fontFamily: 'inherit', outline: 'none' }} />
          </div>
        ))}

        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-soft)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.4px' }}>Área</div>
          <AreaChips value={form.area} onChange={a => setForm(f => ({ ...f, area: a }))} />
        </div>

        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-soft)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.4px' }}>Tu historia</div>
          <textarea value={form.contenido} onChange={e => setForm(f => ({ ...f, contenido: e.target.value }))}
            placeholder="Cuéntanos cómo fue tu proceso…" required rows={5}
            style={{ width: '100%', boxSizing: 'border-box', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 11, padding: '11px 14px', fontSize: 14, color: 'var(--ink)', fontFamily: 'inherit', resize: 'vertical', outline: 'none', lineHeight: 1.6 }} />
        </div>

        <Toggle value={form.anonimo} onChange={v => setForm(f => ({ ...f, anonimo: v }))} label="Publicar como anónimo · Tu nombre no será visible." />

        {error && <div style={{ fontSize: 12.5, color: '#dc2626', textAlign: 'center' }}>{error}</div>}

        <button type="submit" disabled={enviando} style={{
          background: 'var(--primary)', color: 'var(--primary-ink)', fontWeight: 700,
          fontSize: 15, padding: 14, borderRadius: 999, border: 'none',
          cursor: enviando ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: enviando ? .7 : 1,
        }}>
          {enviando ? 'Enviando…' : 'Enviar historia'}
        </button>
        <div style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--ink-soft)' }}>
          🛡️ Tu historia pasa por revisión antes de publicarse.
        </div>
      </form>
    </Backdrop>
  );
}
