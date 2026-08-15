import { useState, useEffect } from 'react';

export const FUENTES = {
  predeterminada: { label: 'Predeterminada', valor: "'Plus Jakarta Sans', system-ui, sans-serif" },
  redondeada:     { label: 'Redondeada',     valor: "'Bricolage Grotesque', sans-serif" },
  sistema:        { label: 'Sistema',        valor: "system-ui, -apple-system, sans-serif" },
  clasica:        { label: 'Clásica',        valor: "Georgia, 'Times New Roman', serif" },
};

// Mismo patrón que useDarkMode: persiste en localStorage y aplica al toque
// vía CSS custom property en <html>, sin necesitar una clase por fuente.
export function useFontFamily() {
  const [fuente, setFuente] = useState(
    () => localStorage.getItem('brota-font') || 'predeterminada'
  );

  useEffect(() => {
    const valor = FUENTES[fuente]?.valor || FUENTES.predeterminada.valor;
    document.documentElement.style.setProperty('--font-body', valor);
    localStorage.setItem('brota-font', fuente);
  }, [fuente]);

  return [fuente, setFuente];
}
