// Mapeo de claves de categoría (BD) → información de display
const CATEGORIAS = {
  tecnologia: {
    emoji: '💻',
    icono: '/icons/icon-categoria-tecnologia.svg',
    titulo: 'Tecnología e Innovación',
    descripcion: 'Tienes una mente analítica y curiosidad por cómo funcionan las cosas. Te atrae resolver problemas técnicos y crear soluciones digitales que impactan a las personas.',
    color: 'blue',
  },
  arte: {
    emoji: '🎨',
    icono: '/icons/icon-categoria-arte.svg',
    titulo: 'Arte y Creatividad',
    descripcion: 'Tu mente piensa en imágenes, formas y posibilidades. Tienes un talento natural para expresar ideas y emociones de maneras que otros no imaginan.',
    color: 'purple',
  },
  diseño: {
    emoji: '✏️',
    titulo: 'Diseño y Comunicación Visual',
    descripcion: 'Combinas creatividad con funcionalidad. Disfrutas crear experiencias visuales que comunican mensajes claros y atractivos.',
    color: 'purple',
  },
  ciencias: {
    emoji: '🔬',
    icono: '/icons/icon-categoria-ciencias.svg',
    titulo: 'Ciencias e Investigación',
    descripcion: 'Te apasiona entender el porqué de las cosas. Eres metódico, observador y disfrutas explorar hipótesis y encontrar respuestas basadas en evidencia.',
    color: 'teal',
  },
  social: {
    emoji: '❤️',
    titulo: 'Vocación Social y Humana',
    descripcion: 'Tu mayor motivación es ayudar a las personas y generar bienestar. Tienes empatía genuina y habilidad natural para conectar con las necesidades de otros.',
    color: 'rose',
  },
  humanidades: {
    emoji: '📖',
    titulo: 'Humanidades y Cultura',
    descripcion: 'Te mueve la reflexión profunda sobre la condición humana. Disfrutas la historia, la filosofía, la literatura y comprender diferentes culturas.',
    color: 'amber',
  },
  negocios: {
    emoji: '💼',
    icono: '/icons/icon-negocios.svg',
    titulo: 'Negocios y Emprendimiento',
    descripcion: 'Tienes visión estratégica y capacidad para ver oportunidades donde otros no las ven. Te emociona crear, dirigir y llevar ideas al mercado.',
    color: 'amber',
  },
  emprendimiento: {
    emoji: '🚀',
    titulo: 'Emprendimiento e Innovación',
    descripcion: 'Eres un creador nato. Te apasiona construir cosas desde cero y asumir riesgos calculados para hacer realidad tus ideas.',
    color: 'amber',
  },
  salud: {
    emoji: '🏥',
    icono: '/icons/icon-categoria-salud.svg',
    titulo: 'Salud y Bienestar',
    descripcion: 'Te importa el cuidado integral de las personas. Tu vocación de servicio y tu interés por las ciencias de la vida te orientan hacia las ciencias de la salud.',
    color: 'rose',
  },
  educacion: {
    emoji: '📚',
    titulo: 'Educación y Pedagogía',
    descripcion: 'Tienes el don de transmitir conocimiento de manera clara e inspiradora. Disfrutas acompañar el crecimiento y el aprendizaje de otros.',
    color: 'emerald',
  },
  comunicacion: {
    emoji: '📡',
    titulo: 'Comunicación y Medios',
    descripcion: 'Eres un contador de historias. Sabes cómo captar la atención, construir mensajes poderosos y llegar al corazón de las audiencias.',
    color: 'blue',
  },
  ambiente: {
    emoji: '🌿',
    titulo: 'Medio Ambiente y Sostenibilidad',
    descripcion: 'Tienes una conexión profunda con la naturaleza y una preocupación genuina por el futuro del planeta. Tu vocación está en proteger y restaurar nuestro entorno.',
    color: 'emerald',
  },
  ambiental: {
    emoji: '🌿',
    titulo: 'Medio Ambiente y Sostenibilidad',
    descripcion: 'Tienes una conexión profunda con la naturaleza y una preocupación genuina por el futuro del planeta.',
    color: 'emerald',
  },
  deporte: {
    emoji: '⚽',
    titulo: 'Deporte y Actividad Física',
    descripcion: 'El movimiento y la competencia te dan energía. Tu disciplina y pasión por el deporte abren caminos en el entrenamiento y la salud deportiva.',
    color: 'teal',
  },
  juridico: {
    emoji: '⚖️',
    titulo: 'Derecho y Justicia',
    descripcion: 'Tienes sentido de la justicia y capacidad argumentativa. Te apasiona defender derechos, entender las normas que rigen la sociedad y resolver conflictos.',
    color: 'purple',
  },
  administrativo: {
    emoji: '📊',
    titulo: 'Gestión y Administración',
    descripcion: 'Tienes habilidad para organizar, planificar y coordinar recursos. Disfrutas optimizar procesos y lograr objetivos con equipos de trabajo.',
    color: 'blue',
  },
};

const FALLBACK_COLORES = ['emerald', 'blue', 'purple', 'amber', 'teal', 'rose'];

export function getCategoriaInfo(clave, idx = 0) {
  if (!clave) {
    return { emoji: '⭐', titulo: 'Tu perfil', descripcion: 'Tus respuestas muestran un perfil único y valioso.', color: 'emerald' };
  }
  const info = CATEGORIAS[clave.toLowerCase()];
  if (info) return info;
  return {
    emoji: '🌟',
    titulo: clave.charAt(0).toUpperCase() + clave.slice(1),
    descripcion: 'Tus respuestas destacan esta área como una de tus fortalezas principales.',
    color: FALLBACK_COLORES[idx % FALLBACK_COLORES.length],
  };
}

// Clave de localStorage compartida entre TestVocacional y ContinueSection
export const storageKey = (userId) => `brota-test-${userId}`;

// { value, label } de las categorías conocidas — usado por el editor de
// preguntas de institución (pages/dashboard/institucion/Cuestionarios.jsx)
// para armar los pesos por opción sin inventar una 5ta lista de categorías
// (ver CLAUDE.md, "Taxonomía de 14 áreas académicas... cuadruplicada").
export const CATEGORIA_OPCIONES = Object.entries(CATEGORIAS).map(([value, { titulo }]) => ({ value, label: titulo }));
