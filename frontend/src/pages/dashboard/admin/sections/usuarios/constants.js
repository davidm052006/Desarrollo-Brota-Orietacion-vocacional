export const ROLES_FILTRO   = ['Todos los roles', 'admin', 'moderador', 'estudiante', 'orientador'];
export const ROLES_OPCIONES = ['estudiante', 'orientador', 'moderador', 'admin'];

export const ROL_COLORS = {
  admin:      'bg-purple-100 text-purple-700',
  moderador:  'bg-primary-soft text-primary',
  orientador: 'bg-orange-100 text-orange-700',
  estudiante: 'bg-blue-100 text-blue-700',
};

export const FORM_VACIO = {
  nombre: '', apellido: '', ciudad: '', nivel_educativo: '',
  condiciones_socioeconomicas: '', edad: '', rol: 'estudiante',
};

export const FORM_NUEVO_VACIO = {
  ...FORM_VACIO,
  email: '', password: '',
};
