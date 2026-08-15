export const isValidEmail = (value) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
};

export const isValidPassword = (value) =>
  value.length >= 8 && /[a-zA-Z]/.test(value) && /[0-9]/.test(value);
export const getPasswordStrength = (password) => {
  let score = 0;

  if (password.length >= 8) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return 'Débil';
  if (score === 3) return 'Media';
  return 'Fuerte';
};


export const validateFields = (fields, mode) => {
  const { email, password, nombre, apellido, confirmPassword,
          nivelEducativo, grado, edad, ciudad, telefono } = fields;
  const errors = {};

  if (mode !== 'forgotPassword') {
    if (!email) errors.email = 'El correo es requerido';
    else if (!isValidEmail(email)) errors.email = 'Correo inválido';

    if (!password) errors.password = 'La contraseña es requerida';
    else if (!isValidPassword(password)) errors.password = 'Mínimo 8 caracteres, con letras y números';
  }

  if (mode === 'forgotPassword') {
    if (!email) errors.email = 'El correo es requerido';
    else if (!isValidEmail(email)) errors.email = 'Correo inválido';
  }

  if (mode === 'signup') {
    if (!nombre) errors.nombre = 'El nombre es requerido';
    if (!apellido) errors.apellido = 'El apellido es requerido';
    if (!confirmPassword) errors.confirmPassword = 'Confirma tu contraseña';
    else if (password !== confirmPassword) errors.confirmPassword = 'Las contraseñas no coinciden';
    if (!nivelEducativo) errors.nivelEducativo = 'El nivel educativo es requerido';
    if (!grado) errors.grado = 'El grado es requerido';
    if (!edad) errors.edad = 'La edad es requerida';
    if (!ciudad) errors.ciudad = 'La ciudad es requerida';
    if (!telefono) errors.telefono = 'El número de teléfono es requerido';
  }

  return errors;
};