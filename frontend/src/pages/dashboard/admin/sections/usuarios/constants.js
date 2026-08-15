export const ROLES_FILTRO   = ['Todos los roles', 'admin', 'estudiante', 'orientador'];
export const ROLES_OPCIONES = ['estudiante', 'orientador', 'admin'];

export const ROL_COLORS = {
  admin:      'bg-purple-100 text-purple-700',
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
