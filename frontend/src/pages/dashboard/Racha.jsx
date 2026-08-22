import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import { obtenerPerfil } from '../../services/perfilService';
import { getItem } from '../../utils/brotiCatalog';

// Elige mascota + mensaje según el estado real de la racha. "racha_rota"
// viene del backend (perfilController.actualizarRacha) y solo es true el
// primer chequeo del día en que se detecta que se perdió una racha en
// curso — no en el primer check-in de siempre.
function estadoMascota(profile) {
  const dias = profile?.racha_dias ?? 0;

  if (profile?.racha_rota) {
    return {
      img: '/logos/logo-triste.svg', anim: 'mascota-temblor',
      titulo: 'Se cortó tu racha',
      mensaje: 'Tenías una racha en curso y se pasó un día. Hoy es un buen momento para empezar otra.',
    };
  }
  if (dias === 0) {
    return {
      img: '/logos/logo-base-limpio.svg', anim: '',
      titulo: 'Todavía no tenés racha',
      mensaje: 'Volvé mañana para empezar a sumar días seguidos.',
    };
  }
  if (dias >= 7 && dias % 7 === 0) {
    return {
      img: '/logos/logo-guino.svg', anim: 'mascota-flotar',
      titulo: `${dias} días seguidos`,
      mensaje: 'Llegaste a otra semana completa. Seguí así.',
    };
  }
  if (dias === 1) {
    return {
      img: '/logos/logo-base-limpio.svg', anim: 'mascota-flotar',
      titulo: 'Arrancaste tu racha',
      mensaje: 'Volvé mañana para que siga sumando.',
    };
  }
  return {
    img: '/logos/logo-feliz.svg', anim: 'mascota-flotar',
    titulo: `${dias} días seguidos`,
    mensaje: 'Tu racha sigue activa. No la dejes enfriar.',
  };
}

export default function Racha({ user, isDemoMode = false }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(location.state?.profile || null);
  const [loading, setLoading] = useState(!location.state?.profile);

  useEffect(() => {
    if (location.state?.profile || !user?.id) { setLoading(false); return; }
    obtenerPerfil(user.id).then(({ success, data }) => {
      if (success) setProfile(data);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (loading) {
    return (
      <DashboardLayout isDemoMode={isDemoMode}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
          <p style={{ color: 'var(--ink-soft)', fontSize: 14 }} className="animate-pulse">Cargando…</p>
        </div>
      </DashboardLayout>
    );
  }

  const dias = profile?.racha_dias ?? 0;
  // Rojo pleno cuanto más consolidada la racha (tope a los 14 días); si se
  // acaba de romper, se apaga casi del todo hacia el gris.
  const intensidad = profile?.racha_rota ? 0.06 : Math.min(0.35 + (dias / 14) * 0.65, 1);
  const { img, anim, titulo, mensaje } = estadoMascota(profile);
  const diasLlenos = Math.min(dias, 7);
  const brotiConfig = profile?.broti_config;
  const fondoItem = brotiConfig?.fondo ? getItem(brotiConfig.fondo) : null;

  return (
    <DashboardLayout profile={{ ...profile, email: user?.email }} isDemoMode={isDemoMode}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '28px 28px 60px' }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', fontSize: 13.5,
            color: 'var(--ink-soft)', fontFamily: 'inherit', padding: 0, marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          ← Volver al inicio
        </button>

        <div
          className="racha-glow"
          style={{
            background: `color-mix(in srgb, #dc2626 ${Math.round(intensidad * 100)}%, #6b7280)`,
            transition: 'background 1s ease',
            borderRadius: 28, padding: '44px 32px', textAlign: 'center', color: '#fff',
          }}
        >
          <div style={{
            position: 'relative', width: 140, height: 140, margin: '0 auto 18px',
            borderRadius: '50%', overflow: 'visible',
            background: fondoItem?.imagen
              ? `url(${fondoItem.imagen}) center / cover`
              : (fondoItem?.color || 'transparent'),
          }}>
            <img
              key={img}
              src={img}
              alt=""
              className={`mascota-entrada ${anim}`}
              style={{ width: '100%', height: '100%', display: 'block' }}
            />
          </div>
          <div className="font-display" style={{ fontSize: 36, fontWeight: 800, lineHeight: 1 }}>
            {dias} {dias === 1 ? 'día' : 'días'}
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, marginTop: 8 }}>{titulo}</div>
          <p style={{ fontSize: 13.5, opacity: .92, marginTop: 10, maxWidth: 360, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>
            {mensaje}
          </p>

          <div style={{ display: 'flex', gap: 8, marginTop: 28, justifyContent: 'center' }}>
            {Array.from({ length: 7 }).map((_, i) => (
              <span
                key={i}
                className="dot-pop"
                style={{
                  animationDelay: `${i * 60}ms`,
                  width: 30, height: 36, borderRadius: 9,
                  background: i < diasLlenos ? 'rgba(255,255,255,.9)' : 'rgba(255,255,255,.25)',
                  border: i < diasLlenos ? 'none' : '1.5px dashed rgba(255,255,255,.55)',
                }}
              />
            ))}
          </div>
        </div>

        <div style={{
          marginTop: 20, background: 'var(--surface)', border: '1px solid var(--line)',
          borderRadius: 20, padding: '20px 22px',
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>
            Para sumar el día de hoy
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              onClick={() => navigate('/dashboard/test')}
              style={{
                textAlign: 'left', background: 'var(--primary-soft)', color: 'var(--primary-deep)',
                fontWeight: 700, fontSize: 13, padding: '11px 14px', borderRadius: 12,
                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Hacer el test vocacional →
            </button>
            <button
              onClick={() => navigate('/dashboard/recursos')}
              style={{
                textAlign: 'left', background: 'var(--surface-2)', color: 'var(--ink)',
                fontWeight: 700, fontSize: 13, padding: '11px 14px', borderRadius: 12,
                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Explorar recursos →
            </button>
          </div>
        </div>

        <button
          onClick={() => navigate('/dashboard/broti')}
          style={{
            marginTop: 14, width: '100%', textAlign: 'center',
            background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--ink)',
            fontWeight: 700, fontSize: 13, padding: '13px 14px', borderRadius: 16,
            cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <img src="/logos/logo-feliz.svg" alt="" style={{ width: 18, height: 18 }} />
          Personalizar a Broti →
        </button>
      </div>
    </DashboardLayout>
  );
}
