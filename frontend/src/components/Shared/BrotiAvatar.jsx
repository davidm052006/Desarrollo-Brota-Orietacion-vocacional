import { getItem } from '../../utils/brotiCatalog';

// Avatar = Broti (la mascota) con lo que el usuario tenga equipado — pensado
// para reemplazar el círculo de inicial en todos lados donde antes se
// mostraba solo la letra.
//
// El `fondo` (si tiene `imagen` real) se dibuja como fondo del círculo
// completo, cubriéndolo. Por ahora la mascota siempre es la misma imagen
// base — cuando existan "variantes" de Broti ya armadas (ver
// utils/brotiCatalog.js), esto pasa a elegir `config.variante` en vez del
// src fijo, sin tocar el resto (mismo patrón que fondo).
//
// `config` puede venir null/undefined (nadie personalizó nada todavía, o es
// una publicación anónima donde no corresponde mostrarlo) — en ese caso el
// que llama debe decidir el fallback (círculo de color + inicial, etc).
export default function BrotiAvatar({ config, size = 36 }) {
  const fondoItem = config?.fondo ? getItem(config.fondo) : null;

  return (
    <span style={{
      position: 'relative', width: size, height: size, borderRadius: '50%',
      background: fondoItem?.imagen
        ? `url(${fondoItem.imagen}) center / cover`
        : (fondoItem?.color || 'var(--primary-soft)'),
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', flexShrink: 0, overflow: 'visible',
    }}>
      <img
        src="/logos/logo-feliz.svg" alt="Broti"
        style={{ width: '78%', height: '78%', objectFit: 'contain' }}
      />
    </span>
  );
}
