// Hooks de sesión, rol y preferencias. Supabase es un fake (vi.hoisted), los
// servicios de auth son stubs y el reloj es falso para el cierre por inactividad.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

const navegar = vi.hoisted(() => vi.fn());
vi.mock('react-router-dom', () => ({ useNavigate: () => navegar }));

const sb = vi.hoisted(() => {
  const perfil = { data: null };
  const consulta = { select: () => consulta, eq: () => consulta, single: async () => perfil };
  return {
    perfil,
    consulta,
    supabase: {
      auth: { getSession: vi.fn(), signOut: vi.fn().mockResolvedValue({ error: null }) },
      from: vi.fn(() => consulta),
    },
  };
});
vi.mock('../config/supabase', () => ({ supabase: sb.supabase }));

const servicios = vi.hoisted(() => ({
  loginWithEmail: vi.fn(),
  signUpWithEmail: vi.fn(),
  sendPasswordReset: vi.fn(),
}));
vi.mock('../services/authService', () => servicios);

import { useAuth } from './useAuth';
import { useAdmin } from './useAdmin';
import { useInstitucion } from './useInstitucion';
import { useModeracion } from './useModeracion';
import { useInactivityLogout } from './useInactivityLogout';
import { useDarkMode } from './useDarkMode';
import { FUENTES, useFontFamily } from './useFontFamily';

const evento = (value) => ({ target: { value } });
const submit = () => ({ preventDefault: vi.fn() });

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  sb.perfil.data = null;
  sb.supabase.auth.getSession.mockResolvedValue({ data: { session: null } });
});
afterEach(() => vi.unstubAllEnvs());

describe('useAuth', () => {
  it('login con campos vacíos muestra errores y no llama al servicio', async () => {
    const { result } = renderHook(() => useAuth());
    await act(() => result.current.handleLogin(submit()));
    expect(result.current.validationErrors).toEqual({ email: 'El correo es requerido', password: 'La contraseña es requerida' });
    expect(servicios.loginWithEmail).not.toHaveBeenCalled();
  });

  it('login correcto navega al dashboard', async () => {
    servicios.loginWithEmail.mockResolvedValue({ success: true });
    const { result } = renderHook(() => useAuth());
    act(() => {
      result.current.onEmailChange(evento('ana@brota.co'));
      result.current.onPasswordChange(evento('Clave1234'));
    });
    await act(() => result.current.handleLogin(submit()));
    expect(servicios.loginWithEmail).toHaveBeenCalledWith('ana@brota.co', 'Clave1234');
    expect(navegar).toHaveBeenCalledWith('/dashboard');
    expect(result.current.loading).toBe(false);
  });

  it('login rechazado muestra el error del servicio y no navega', async () => {
    servicios.loginWithEmail.mockResolvedValue({ success: false, error: 'Correo o contraseña incorrectos.' });
    const { result } = renderHook(() => useAuth());
    act(() => {
      result.current.onEmailChange(evento('ana@brota.co'));
      result.current.onPasswordChange(evento('Clave1234'));
    });
    await act(() => result.current.handleLogin(submit()));
    expect(result.current.error).toBe('Correo o contraseña incorrectos.');
    expect(navegar).not.toHaveBeenCalled();
  });

  it('valida el correo mientras se escribe', () => {
    const { result } = renderHook(() => useAuth());
    act(() => result.current.onEmailChange(evento('ana@')));
    expect(result.current.validationErrors.email).toBe('Correo inválido');
    act(() => result.current.onEmailChange(evento('ana@brota.co')));
    expect(result.current.validationErrors.email).toBe('');
    act(() => result.current.onEmailChange(evento('x')));
    act(() => result.current.onEmailChange(evento('')));
    expect(result.current.validationErrors.email).toBe('');
  });

  describe('registro', () => {
    const llenar = (r) => act(() => {
      r.current.changeMode('signup');
      r.current.onPrimerNombreChange(evento('Ana'));
      r.current.onSegundoNombreChange(evento('María'));
      r.current.onPrimerApellidoChange(evento('Ruiz'));
      r.current.onSegundoApellidoChange(evento(''));
      r.current.onEmailChange(evento('ana@brota.co'));
      r.current.onPasswordChange(evento('Clave1234'));
      r.current.onConfirmPasswordChange(evento('Clave1234'));
      r.current.onNivelEducativoChange('media');
      r.current.onGradoChange('11');
      r.current.onEdadChange(evento('2009-05-01'));
      r.current.onCiudadChange(evento('Cali'));
      r.current.onTelefonoChange(evento('3001234567'));
    });

    it('sin aceptar términos no valida ni envía', async () => {
      const { result } = renderHook(() => useAuth());
      llenar(result);
      await act(() => result.current.handleSignup(submit()));
      expect(result.current.error).toMatch(/términos y condiciones/);
      expect(servicios.signUpWithEmail).not.toHaveBeenCalled();
    });

    it('arma nombre y apellido completos y manda los datos extra', async () => {
      servicios.signUpWithEmail.mockResolvedValue({ success: true });
      const { result } = renderHook(() => useAuth());
      llenar(result);
      act(() => result.current.onTermsAcceptedChange({ target: { checked: true } }));
      await act(() => result.current.handleSignup(submit()));
      expect(servicios.signUpWithEmail).toHaveBeenCalledWith('ana@brota.co', 'Clave1234', 'Ana María', 'Ruiz', {
        nivelEducativo: 'media', grado: '11', fechaNacimiento: '2009-05-01', ciudad: 'Cali', telefono: '3001234567',
      });
      expect(navegar).toHaveBeenCalledWith('/dashboard');
    });

    it('los errores de nombre y apellido se muestran en el primer campo', async () => {
      const { result } = renderHook(() => useAuth());
      act(() => result.current.changeMode('signup'));
      act(() => result.current.onTermsAcceptedChange({ target: { checked: true } }));
      await act(() => result.current.handleSignup(submit()));
      expect(result.current.validationErrors).toMatchObject({
        primerNombre: 'El nombre es requerido',
        primerApellido: 'El apellido es requerido',
        telefono: 'El número de teléfono es requerido',
      });
    });

    it('error del servicio se muestra; cambiar de modo limpia mensajes y términos', async () => {
      servicios.signUpWithEmail.mockResolvedValue({ success: false, error: 'Ya existe una cuenta' });
      const { result } = renderHook(() => useAuth());
      llenar(result);
      act(() => result.current.onTermsAcceptedChange({ target: { checked: true } }));
      await act(() => result.current.handleSignup(submit()));
      expect(result.current.error).toBe('Ya existe una cuenta');
      act(() => result.current.changeMode('login'));
      expect(result.current).toMatchObject({ mode: 'login', error: null, termsAccepted: false });
    });
  });

  describe('recuperar contraseña', () => {
    it('pide un correo válido', async () => {
      const { result } = renderHook(() => useAuth());
      await act(() => result.current.handlePasswordRecovery(submit()));
      expect(result.current.validationErrors).toEqual({ email: 'El correo es requerido' });
      expect(servicios.sendPasswordReset).not.toHaveBeenCalled();
    });

    it('éxito muestra el aviso; fallo muestra el error', async () => {
      servicios.sendPasswordReset.mockResolvedValueOnce({ success: true });
      const { result } = renderHook(() => useAuth());
      act(() => result.current.onEmailChange(evento('ana@brota.co')));
      await act(() => result.current.handlePasswordRecovery(submit()));
      expect(result.current.successMessage).toBe('Revisa tu correo para restablecer tu contraseña.');

      servicios.sendPasswordReset.mockResolvedValueOnce({ success: false, error: 'Límite de correos' });
      await act(() => result.current.handlePasswordRecovery(submit()));
      expect(result.current).toMatchObject({ error: 'Límite de correos', successMessage: null });
    });
  });
});

describe('hooks de rol', () => {
  const conSesion = (rolData) => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://x.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon');
    sb.supabase.auth.getSession.mockResolvedValue({ data: { session: { user: { id: 'u-1' } } } });
    sb.perfil.data = rolData;
  };
  const demo = (email) => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    localStorage.setItem('demoModeLoggedIn', 'true');
    localStorage.setItem('demoUserEmail', email);
  };

  it('useAdmin: solo el rol admin es admin', async () => {
    conSesion({ rol: 'admin' });
    const a = renderHook(() => useAdmin());
    await waitFor(() => expect(a.result.current.loading).toBe(false));
    expect(a.result.current.isAdmin).toBe(true);
    expect(sb.supabase.from).toHaveBeenCalledWith('perfiles_usuario');

    conSesion({ rol: 'moderador' });
    const b = renderHook(() => useAdmin());
    await waitFor(() => expect(b.result.current.loading).toBe(false));
    expect(b.result.current.isAdmin).toBe(false);
  });

  it('useAdmin: sin sesión no es admin y no consulta perfiles', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://x.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon');
    const { result } = renderHook(() => useAdmin());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isAdmin).toBe(false);
    expect(sb.supabase.from).not.toHaveBeenCalled();
  });

  it('useAdmin en modo demo depende del correo guardado', async () => {
    demo('otro@x.co');
    const { result } = renderHook(() => useAdmin());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isAdmin).toBe(false);
    expect(sb.supabase.auth.getSession).not.toHaveBeenCalled();
  });

  it('useModeracion: admin y moderador pueden moderar, estudiante no', async () => {
    for (const [rol, puede] of [['admin', true], ['moderador', true], ['estudiante', false]]) {
      conSesion({ rol });
      const { result } = renderHook(() => useModeracion());
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current).toMatchObject({ rol, puedeModerar: puede, esAdmin: rol === 'admin' });
    }
  });

  it('useModeracion sin sesión o en demo', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://x.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon');
    const a = renderHook(() => useModeracion());
    await waitFor(() => expect(a.result.current.loading).toBe(false));
    expect(a.result.current.rol).toBeNull();

    demo('alguien@x.co');
    const b = renderHook(() => useModeracion());
    await waitFor(() => expect(b.result.current.loading).toBe(false));
    expect(b.result.current).toMatchObject({ rol: 'estudiante', puedeModerar: false });
  });

  it('useInstitucion pide cuestionario si falta el contacto', async () => {
    conSesion({ rol: 'institucion', institucion_contacto: null });
    const a = renderHook(() => useInstitucion());
    await waitFor(() => expect(a.result.current.loading).toBe(false));
    expect(a.result.current).toMatchObject({ esInstitucion: true, necesitaCuestionario: true });

    conSesion({ rol: 'institucion', institucion_contacto: { tel: '1' } });
    const b = renderHook(() => useInstitucion());
    await waitFor(() => expect(b.result.current.loading).toBe(false));
    expect(b.result.current).toMatchObject({ esInstitucion: true, necesitaCuestionario: false });

    conSesion({ rol: 'estudiante' });
    const c = renderHook(() => useInstitucion());
    await waitFor(() => expect(c.result.current.loading).toBe(false));
    expect(c.result.current).toMatchObject({ esInstitucion: false, necesitaCuestionario: false });
  });

  it('useInstitucion sin sesión o en demo nunca es institución', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://x.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon');
    const a = renderHook(() => useInstitucion());
    await waitFor(() => expect(a.result.current.loading).toBe(false));
    expect(a.result.current.esInstitucion).toBe(false);

    demo('x@x.co');
    const b = renderHook(() => useInstitucion());
    await waitFor(() => expect(b.result.current.loading).toBe(false));
    expect(b.result.current.esInstitucion).toBe(false);
  });
});

describe('useInactivityLogout', () => {
  const MIN = 60_000;
  let hrefOriginal;

  beforeEach(() => {
    vi.useFakeTimers();
    hrefOriginal = window.location;
    Object.defineProperty(window, 'location', { configurable: true, value: { href: '/dashboard' } });
  });
  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(window, 'location', { configurable: true, value: hrefOriginal });
  });

  it('avisa al minuto 29, cuenta hacia atrás y cierra sesión al 30', async () => {
    const { result } = renderHook(() => useInactivityLogout(false));
    act(() => vi.advanceTimersByTime(29 * MIN - 1));
    expect(result.current.mostrarAviso).toBe(false);

    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toMatchObject({ mostrarAviso: true, segundosRestantes: 60 });

    act(() => vi.advanceTimersByTime(5_000));
    expect(result.current.segundosRestantes).toBe(55);

    await act(async () => { vi.advanceTimersByTime(55_000); });
    expect(sb.supabase.auth.signOut).toHaveBeenCalledTimes(1);
    expect(window.location.href).toBe('/');
  });

  it('cualquier actividad reinicia el contador y oculta el aviso', () => {
    const { result } = renderHook(() => useInactivityLogout(false));
    act(() => vi.advanceTimersByTime(29 * MIN));
    expect(result.current.mostrarAviso).toBe(true);

    act(() => { window.dispatchEvent(new Event('keydown')); });
    expect(result.current.mostrarAviso).toBe(false);
    act(() => vi.advanceTimersByTime(29 * MIN - 1));
    expect(result.current.mostrarAviso).toBe(false);
    expect(sb.supabase.auth.signOut).not.toHaveBeenCalled();
  });

  it('en modo demo borra los datos locales en vez de llamar a Supabase', async () => {
    localStorage.setItem('demoModeLoggedIn', 'true');
    localStorage.setItem('demoUserEmail', 'a@b.co');
    const { result, unmount } = renderHook(() => useInactivityLogout(true));
    await act(() => result.current.cerrarSesionAhora());
    expect(localStorage.getItem('demoModeLoggedIn')).toBeNull();
    expect(localStorage.getItem('demoUserEmail')).toBeNull();
    expect(sb.supabase.auth.signOut).not.toHaveBeenCalled();

    unmount();
    act(() => vi.advanceTimersByTime(31 * MIN));
    expect(sb.supabase.auth.signOut).not.toHaveBeenCalled();
  });
});

describe('preferencias de apariencia', () => {
  it('useDarkMode lee, aplica y guarda el tema', () => {
    localStorage.setItem('brota-theme', 'dark');
    const { result } = renderHook(() => useDarkMode());
    expect(result.current[0]).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    act(() => result.current[1]());
    expect(result.current[0]).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('brota-theme')).toBe('light');
  });

  it('useFontFamily aplica la fuente elegida y cae a la predeterminada si no existe', () => {
    const { result } = renderHook(() => useFontFamily());
    expect(result.current[0]).toBe('predeterminada');
    const css = () => document.documentElement.style.getPropertyValue('--font-body');

    act(() => result.current[1]('clasica'));
    expect(css()).toBe(FUENTES.clasica.valor);
    expect(localStorage.getItem('brota-font')).toBe('clasica');

    act(() => result.current[1]('inventada'));
    expect(css()).toBe(FUENTES.predeterminada.valor);
  });
});
