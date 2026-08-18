import { useEffect, useRef, useState, useCallback } from 'react';
import { handleLogout } from '../utils/auth';

const TIEMPO_TOTAL_MS = 30 * 60 * 1000; // 30 min de inactividad
const AVISO_ANTES_MS  = 60 * 1000;      // avisar 1 min antes de cerrar

// Cierra sesión por inactividad — se resetea con cualquier interacción
// (mouse, teclado, scroll, touch). Avisa 1 minuto antes por si hay algo
// escribiéndose (ej. una historia larga en Comunidad) para no perderlo
// sin avisar.
export function useInactivityLogout(isDemoMode = false) {
  const [mostrarAviso, setMostrarAviso] = useState(false);
  const [segundosRestantes, setSegundosRestantes] = useState(60);

  const timeoutAvisoRef  = useRef(null);
  const timeoutLogoutRef = useRef(null);
  const intervalRef      = useRef(null);

  const cerrarSesion = useCallback(() => {
    handleLogout(isDemoMode);
  }, [isDemoMode]);

  const reiniciar = useCallback(() => {
    clearTimeout(timeoutAvisoRef.current);
    clearTimeout(timeoutLogoutRef.current);
    clearInterval(intervalRef.current);
    setMostrarAviso(false);

    timeoutAvisoRef.current = setTimeout(() => {
      setSegundosRestantes(Math.floor(AVISO_ANTES_MS / 1000));
      setMostrarAviso(true);
      intervalRef.current = setInterval(() => {
        setSegundosRestantes(s => (s <= 1 ? 0 : s - 1));
      }, 1000);
    }, TIEMPO_TOTAL_MS - AVISO_ANTES_MS);

    timeoutLogoutRef.current = setTimeout(cerrarSesion, TIEMPO_TOTAL_MS);
  }, [cerrarSesion]);

  useEffect(() => {
    reiniciar();
    const eventos = ['mousemove', 'keydown', 'mousedown', 'scroll', 'touchstart'];
    eventos.forEach(e => window.addEventListener(e, reiniciar));
    return () => {
      eventos.forEach(e => window.removeEventListener(e, reiniciar));
      clearTimeout(timeoutAvisoRef.current);
      clearTimeout(timeoutLogoutRef.current);
      clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { mostrarAviso, segundosRestantes, seguirConectado: reiniciar, cerrarSesionAhora: cerrarSesion };
}
