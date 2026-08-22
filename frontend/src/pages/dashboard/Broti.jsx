import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import { obtenerPerfil, actualizarBroti } from '../../services/perfilService';
import { CATEGORIAS, getItem, getItemsPorCategoria } from '../../utils/brotiCatalog';

function BrotiPreview({ config }) {
  const fondoItem = config?.fondo ? getItem(config.fondo) : null;
  return (
    <div style={{
      position: 'relative', width: 220, height: 220, margin: '0 auto',
      background: fondoItem?.imagen
        ? `url(${fondoItem.imagen}) center / cover`
        : (fondoItem?.color || 'var(--surface-2)'),
      borderRadius: 28,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <img src="/logos/logo-feliz.svg" alt="Broti" style={{ width: 140, height: 140 }} />
    </div>
  );
}

export default function Broti({ user, isDemoMode = false }) {
  const [profile, setProfile] = useState(null);
  const [config, setConfig] = useState({});
  const [cargando, setCargando] = useState(true);
  const [tab, setTab] = useState('mio');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    obtenerPerfil(user.id).then(({ success, data }) => {
      if (success) {
        setProfile(data);
        setConfig(data.broti_config ?? {});
      }
      setCargando(false);
    });
  }, [user?.id]);

  async function equipar(itemId) {
    const item = getItem(itemId);
    if (!item) return;
    const yaEquipado = config[item.categoria] === itemId;
    const nuevoConfig = { ...config, [item.categoria]: yaEquipado ? null : itemId };
    setConfig(nuevoConfig);
    if (isDemoMode) return;
    setGuardando(true);
    await actualizarBroti(user.id, nuevoConfig);
    setGuardando(false);
  }

  const profileFull = { ...profile, email: user?.email };

  return (
    <DashboardLayout profile={profileFull} isDemoMode={isDemoMode}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '28px 28px 60px' }}>
        <h1 className="font-display" style={{ fontSize: 24, fontWeight: 800, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
          Personaliza a Broti
          <img src="/logos/logo-feliz.svg" alt="" style={{ width: 26, height: 26 }} />
        </h1>
        <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 22 }}>
          Elegí el fondo de tu Broti.
        </p>

        {cargando ? (
          <p style={{ color: 'var(--ink-soft)', fontSize: 14 }} className="animate-pulse">Cargando…</p>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
              {[['mio', 'Mi Broti'], ['tienda', 'Tienda']].map(([k, l]) => (
                <button key={k} onClick={() => setTab(k)} style={{
                  fontSize: 13.5, fontWeight: tab === k ? 700 : 600, padding: '9px 18px', borderRadius: 999,
                  border: tab === k ? 'none' : '1px solid var(--line)',
                  background: tab === k ? 'var(--primary)' : 'var(--surface)',
                  color: tab === k ? 'var(--primary-ink)' : 'var(--ink-soft)',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>{l}</button>
              ))}
            </div>

            {tab === 'mio' ? (
              <div style={{
                background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 20,
                padding: 24,
              }}>
                <BrotiPreview config={config} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24 }}>
                  {CATEGORIAS.map(({ key, nombre, icono }) => {
                    const item = config[key] ? getItem(config[key]) : null;
                    return (
                      <div key={key} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 14px', background: 'var(--surface-2)', borderRadius: 12,
                      }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{icono} {nombre}</span>
                        {item ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>{item.swatch} {item.nombre}</span>
                            <button onClick={() => equipar(item.id)} style={{
                              fontSize: 11.5, color: 'var(--ink-soft)', background: 'none', border: 'none',
                              cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline',
                            }}>Quitar</button>
                          </div>
                        ) : (
                          <span style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>Nada equipado</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {isDemoMode && <p style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 14 }}>No se guarda en modo demo.</p>}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                {CATEGORIAS.map(({ key, nombre, icono }) => (
                  <div key={key}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 10 }}>{icono} {nombre}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                      {getItemsPorCategoria(key).map(item => {
                        const equipado = config[key] === item.id;
                        return (
                          <button key={item.id} onClick={() => equipar(item.id)} disabled={guardando} style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                            padding: '14px 8px', borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit',
                            background: equipado ? 'var(--primary-soft)' : 'var(--surface)',
                            border: equipado ? '2px solid var(--primary)' : '1px solid var(--line)',
                          }}>
                            <span style={{
                              width: 40, height: 40, borderRadius: 10,
                              background: item.imagen ? `url(${item.imagen}) center / cover` : item.color,
                              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                            }}>{!item.imagen && item.swatch}</span>
                            <span style={{ fontSize: 11.5, fontWeight: 600, textAlign: 'center' }}>{item.nombre}</span>
                            <span style={{
                              fontSize: 9.5, fontWeight: 700, padding: '2px 7px', borderRadius: 999,
                              background: item.gratis ? 'var(--primary-soft)' : 'var(--accent-soft)',
                              color: item.gratis ? 'var(--primary-deep)' : 'var(--accent)',
                            }}>{item.gratis ? 'Gratis' : 'Premium'}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <p style={{ fontSize: 11.5, color: 'var(--ink-soft)' }}>
                  Por ahora todo se puede usar sin costo — la tienda de verdad (con algo para "ganar" los items premium) se arma más adelante.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
