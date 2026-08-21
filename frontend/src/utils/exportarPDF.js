// Captura un elemento del DOM (incluye los <canvas> de Chart.js) y lo empaqueta
// en un PDF de una sola página, descargado directo al navegador. Usado tanto
// por las analíticas del panel admin como por la exportación del resultado
// del test vocacional — misma necesidad, un solo helper.
// jspdf/html2canvas se importan dinámicamente (~180kB juntos) para no sumarlos
// al bundle inicial de toda la app — solo se descargan cuando alguien hace
// clic en "Descargar PDF", no en cada carga de página.
export async function exportarElementoAPDF(elemento, nombreArchivo = 'brota-export.pdf') {
  if (!elemento) return;

  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  const fondo = getComputedStyle(document.documentElement).getPropertyValue('--surface').trim() || '#ffffff';
  const canvas = await html2canvas(elemento, { scale: 2, backgroundColor: fondo, useCORS: true });
  const imgData = canvas.toDataURL('image/png');

  const pdf = new jsPDF({
    orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
    unit: 'px',
    format: [canvas.width, canvas.height],
  });
  pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
  pdf.save(nombreArchivo);
}
