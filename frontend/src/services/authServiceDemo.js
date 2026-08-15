const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const loginWithEmail = async (email) => {
  await delay(1200);
  localStorage.setItem('demoModeLoggedIn', 'true');
  localStorage.setItem('demoUserEmail', email);
  localStorage.setItem('demoUserName', 'Usuario Demo');
  return { success: true };
};

export const signUpWithEmail = async (email, _password, nombre, apellido) => {
  await delay(1200);
  localStorage.setItem('demoModeLoggedIn', 'true');
  localStorage.setItem('demoUserEmail', email);
  localStorage.setItem('demoUserName', `${nombre} ${apellido}`);
  return { success: true };
};

export const sendPasswordReset = async (_email) => {
  await delay(800);
  return { success: true };
};
