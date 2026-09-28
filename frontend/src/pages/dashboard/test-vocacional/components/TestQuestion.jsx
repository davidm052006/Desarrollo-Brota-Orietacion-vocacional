import { normalizarTipo, esSeleccionMultiple, TIPO_POR_DEFECTO } from '../../../../utils/tiposPregunta';
import { VISTAS_POR_TIPO } from './tipos';

// Dispatcher de preguntas del test vocacional.
//
// Se queda solo con lo que es común a todos los tipos —badge de categoría,
// título, copy de ayuda y barra de navegación— y delega el cuerpo de opciones
// al componente registrado en `tipos/index.js` para el tipo ya normalizado.
// Antes este archivo tenía el render de los tres tipos mezclado con `if`s sobre
// `pregunta.tipo` comparado contra strings sueltos (`'likert'`, `'multiple'`),
// que no cubrían los valores que escriben los CRUD de admin e institución.
//
// Props:
//   pregunta: { id, texto, tipo, categoria?, opciones: [{id, label, icon, orden}] }
//   preguntaNumero: number (1-based)
//   totalPreguntas: number
//   seleccionadas: string[]
//   onSeleccionar: (id) => void
//   onAnterior, onSiguiente: () => void
//   puedeAvanzar: boolean
//   guardando: boolean
//   esUltima: boolean

const PREGUNTA_DEMO = {
  id: 'demo',
  texto: '¿Qué actividades disfrutas en tu tiempo libre?',
  tipo: 'opcion_multiple',
  opciones: [
    { id: 'a', label: 'Dibujar, diseñar o crear cosas',                icon: '🎨' },
    { id: 'b', label: 'Pasar tiempo con amigos o conocer gente nueva', icon: '🤝' },
    { id: 'c', label: 'Jugar videojuegos',                             icon: '🎮' },
    { id: 'd', label: 'Leer, escribir o aprender sobre temas nuevos',  icon: '📚' },
    { id: 'e', label: 'Resolver problemas o retos mentales',           icon: '🧩' },
    { id: 'f', label: 'Tomar fotos, grabar videos o editar contenido', icon: '📷' },
    { id: 'g', label: 'Programar, usar tecnología o investigar',       icon: '💻' },
    { id: 'h', label: 'Hacer deporte o actividades al aire libre',     icon: '🏃' },
  ],
};

function splitTexto(texto) {
  if (!texto) return { normal: '', verde: '' };
  const m = texto.match(/^(.+?)\s+(en tu\b.+|para tu\b.+|sobre tu\b.+|de tu\b.+|con tu\b.+)$/i);
  if (m) return { normal: m[1], verde: m[2] };
  const w = texto.split(' ');
  const h = Math.ceil(w.length / 2);
  return { normal: w.slice(0, h).join(' '), verde: w.slice(h).join(' ') };
}

export default function TestQuestion({
  pregunta       = PREGUNTA_DEMO,
  preguntaNumero = 1,
  totalPreguntas = 30,
  seleccionadas  = [],
  onSeleccionar  = () => {},
  onAnterior     = () => {},
  onSiguiente    = () => {},
  puedeAvanzar   = false,
  guardando      = false,
  esUltima       = false,
}) {
  const tipo       = normalizarTipo(pregunta.tipo);
  const esMultiple = esSeleccionMultiple(tipo);
  // Un tipo del catálogo sin vista registrada no debe dejar la pregunta en
  // blanco: cae a la del tipo por defecto, igual que normalizarTipo.
  const VistaOpciones = VISTAS_POR_TIPO[tipo] ?? VISTAS_POR_TIPO[TIPO_POR_DEFECTO];

  const { normal, verde } = splitTexto(pregunta.texto);
  const opciones = pregunta.opciones ?? [];

  const catLabel = pregunta.categoria
    ? pregunta.categoria.charAt(0).toUpperCase() + pregunta.categoria.slice(1)
    : 'Intereses';

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 24,
      padding: '34px 40px', boxShadow: 'var(--shadow)',
    }}>
      {/* Category badge + question */}
      <div style={{ textAlign: 'center' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          background: 'var(--primary-soft)', color: 'var(--primary-deep)',
          fontSize: 12, fontWeight: 700, padding: '5px 13px', borderRadius: 999,
        }}>
          🎯 {catLabel}
        </span>
        <div className="font-display" style={{ fontWeight: 800, fontSize: 28, marginTop: 16, lineHeight: 1.15 }}>
          {normal}{' '}
          {verde && <span style={{ color: 'var(--primary)' }}>{verde}</span>}
        </div>
        <div style={{ color: 'var(--ink-soft)', fontSize: 13.5, marginTop: 8 }}>
          {esMultiple
            ? 'Selecciona todas las opciones que apliquen para ti.'
            : 'No hay respuestas correctas. Elige la opción que mejor te represente.'}
        </div>
      </div>

      {/* Cuerpo de opciones — lo pone la vista del tipo */}
      <VistaOpciones
        pregunta={pregunta}
        opciones={opciones}
        seleccionadas={seleccionadas}
        onSeleccionar={onSeleccionar}
      />

      {/* Navigation */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginTop: 30, paddingTop: 20, borderTop: '1px solid var(--line)',
      }}>
        <button onClick={onAnterior} disabled={preguntaNumero === 1} style={{
          fontSize: 14, fontWeight: 600, color: 'var(--ink-soft)',
          background: 'none', border: 'none', cursor: preguntaNumero === 1 ? 'not-allowed' : 'pointer',
          opacity: preguntaNumero === 1 ? .3 : 1, fontFamily: 'inherit',
        }}>
          ← Anterior
        </button>

        <span style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>
          Paso {Math.ceil((preguntaNumero / totalPreguntas) * 6)} de 6 · perfil en construcción 🌱
        </span>

        <button onClick={onSiguiente} disabled={!puedeAvanzar || guardando} style={{
          background: puedeAvanzar ? 'var(--primary)' : 'var(--surface-2)',
          color: puedeAvanzar ? 'var(--primary-ink)' : 'var(--ink-soft)',
          padding: '12px 28px', borderRadius: 999, border: 'none',
          fontWeight: 700, fontSize: 14, cursor: puedeAvanzar && !guardando ? 'pointer' : 'not-allowed',
          boxShadow: puedeAvanzar ? '0 8px 20px var(--primary-glow)' : 'none',
          fontFamily: 'inherit', transition: 'all .15s',
        }}>
          {guardando ? 'Guardando...' : esUltima ? 'Ver resultados →' : 'Siguiente →'}
        </button>
      </div>
    </div>
  );
}
