import { getItem, MASCOTA_BASE } from '../../utils/brotiCatalog';

// Avatar = Broti (la mascota) con lo que el usuario tenga equipado — pensado
// para reemplazar el círculo de inicial en todos lados donde antes se
// mostraba solo la letra.
//
// El `fondo` (si tiene `imagen` real) se dibuja como fondo del círculo
// completo, cubriéndolo. La mascota en sí es `MASCOTA_BASE` salvo que haya
// una `variante` equipada (imagen completa alternativa, ver
// utils/brotiCatalog.js) — no se combinan piezas sueltas, la variante
// reemplaza la imagen entera.
//
// `config` puede venir null/undefined (nadie personalizó nada todavía, o es
// una publicación anónima donde no corresponde mostrarlo) — en ese caso el
// que llama debe decidir el fallback (círculo de color + inicial, etc).
export default function BrotiAvatar({ config, size = 36 }) {
  const fondoItem = config?.fondo ? getItem(config.fondo) : null;
  const varianteItem = config?.variante ? getItem(config.variante) : null;

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
        src={varianteItem?.imagen || MASCOTA_BASE} alt="Broti"
        style={{ width: '78%', height: '78%', objectFit: 'contain' }}
      />
    </span>
  );
}
