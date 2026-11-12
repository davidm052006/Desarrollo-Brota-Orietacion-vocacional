// CSS de las vistas por tipo. Vive en un string y no en Tailwind ni en
// index.css por dos motivos: el resto del test usa `style={{}}` inline (que no
// admite `@media` ni `:focus-visible`), y así cada vista queda autocontenida
// sin tocar archivos compartidos.
//
// Es el primer `@media` del proyecto — hasta ahora todo el dashboard era
// desktop-only. Si se hace el pase responsive general, esto deberia migrar a
// donde viva esa convencion.

export const ESTILOS_TIPOS = `
.bq-opt {
  display: flex; align-items: center; gap: 12px;
  border-radius: 18px; text-align: left; width: 100%;
  cursor: pointer; font-family: inherit;
  transition: border-color .15s, background .15s, transform .15s;
}
.bq-opt:hover { transform: translateY(-1px); }
.bq-opt:focus-visible {
  outline: 3px solid var(--primary);
  outline-offset: 2px;
}

/* Opción única: una sola columna, tarjetas más altas y con más aire. */
.bq-unica { display: grid; grid-template-columns: 1fr; gap: 10px; margin-top: 24px; }
.bq-unica .bq-opt { padding: 18px 20px; }

/* Opción múltiple: dos columnas, tarjetas compactas. */
.bq-multiple { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 24px; }
.bq-multiple .bq-opt { padding: 14px 16px; }

@media (max-width: 640px) {
  .bq-multiple { grid-template-columns: 1fr; }
}

/* Likert: escala horizontal; en móvil no se comprime, se scrollea. */
.bq-likert-wrap { margin-top: 30px; overflow-x: auto; padding-bottom: 4px; }
.bq-likert {
  position: relative; display: flex; align-items: flex-start;
  justify-content: space-between; gap: 10px; min-width: 460px;
}
.bq-likert-punto {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  gap: 11px; z-index: 1; cursor: pointer; background: none;
  border: none; font-family: inherit; padding: 0;
}
.bq-likert-punto:focus-visible { outline: 3px solid var(--primary); outline-offset: 4px; border-radius: 12px; }
`;
