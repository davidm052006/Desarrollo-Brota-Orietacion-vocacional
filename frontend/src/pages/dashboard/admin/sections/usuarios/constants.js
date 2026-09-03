export const ROLES_FILTRO   = ['Todos los roles', 'admin', 'moderador', 'estudiante', 'orientador', 'institucion'];
export const ROLES_OPCIONES = ['estudiante', 'orientador', 'moderador', 'admin', 'institucion'];

export const ROL_COLORS = {
  admin:       'bg-purple-100 text-purple-700',
  moderador:   'bg-primary-soft text-primary',
  orientador:  'bg-orange-100 text-orange-700',
  estudiante:  'bg-blue-100 text-blue-700',
  institucion: 'bg-amber-100 text-amber-700',
};

// Mismos values que usa el registro público (pages/landing/components/SignupCard.jsx)
// — no inventar otros acá, o los usuarios creados desde el panel admin quedan
// con valores de nivel_educativo/grado que el resto de la app no reconoce.
export const NIVEL_EDUCATIVO_OPCIONES = [
  { value: 'Educacion media', label: 'Educación media' },
  { value: 'Tecnico',         label: 'Técnico' },
];
export const GRADO_OPCIONES = ['Noveno', 'Décimo', 'Once'];

// Usado por "Editar usuario" — el usuario ya existe y solo tiene la edad
// (entero) guardada, no la fecha de nacimiento original (nunca se persiste,
// mismo criterio que Perfil.jsx), así que acá se sigue editando como número.
export const FORM_VACIO = {
  nombre: '', apellido: '', ciudad: '', nivel_educativo: '',
  condiciones_socioeconomicas: '', edad: '', grado: '', telefono: '', rol: 'estudiante',
};

// Usado por "Nuevo usuario" — pide fecha de nacimiento en vez de edad suelta,
// igual que el registro público, y el backend calcula la edad entera.
export const FORM_NUEVO_VACIO = {
  nombre: '', apellido: '', ciudad: '', nivel_educativo: '',
  condiciones_socioeconomicas: '', fecha_nacimiento: '', grado: '', telefono: '',
  rol: 'estudiante', email: '', password: '',
  // Solo se usa cuando rol === 'institucion' (ver ModalNuevoUsuario.jsx)
  institucion_id: '', institucion_nombre: '',
};

// Duraciones predefinidas para ModalPermisosUsuario — 'custom' habilita un
// input de fecha para elegir un momento puntual en vez de un rango relativo.
export const DURACIONES_BLOQUEO = [
  { value: '1',      label: '1 día' },
  { value: '3',      label: '3 días' },
  { value: '7',      label: '7 días' },
  { value: '30',     label: '30 días' },
  { value: 'custom', label: 'Fecha personalizada' },
];