import { useEffect, useRef, useState } from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale, CategoryScale, LinearScale,
  PointElement, LineElement, BarElement,
  Filler, Tooltip, Legend,
} from 'chart.js';
import { Radar, Bar } from 'react-chartjs-2';
import { getAnalytics } from '../../../../services/adminService';
import { AREA_LABEL, getAreaChartColor, getCssVar } from '../../../../utils/areaColors';
import { exportarElementoAPDF } from '../../../../utils/exportarPDF';

ChartJS.register(RadialLinearScale, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler, Tooltip, Legend);

export default function AnaliticasSection() {
  const [datos, setDatos]       = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError]       = useState(null);
  const [exportando, setExportando] = useState(false);
  const contenedorRef = useRef(null);

  useEffect(() => {
    getAnalytics().then(({ success, data, error: err }) => {
      if (success) setDatos(data);
      else setError(err ?? 'No se pudieron cargar las analíticas.');
      setCargando(false);
    });
  }, []);

  const handleExportar = async () => {
    setExportando(true);
    await exportarElementoAPDF(contenedorRef.current, 'brota-analiticas.pdf');
    setExportando(false);
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin w-8 h-8 border-2 border-gray-200 border-t-primary rounded-full" />
      </div>
    );
  }

  if (error || !datos) {
    return (
      <div className="text-center py-24 text-sm text-gray-400">
        {error ?? 'No hay datos disponibles todavía.'}
      </div>
    );
  }

  const categorias = Object.keys({ ...datos.promedioPorCategoria, ...datos.conteoPorCategoria });

  if (categorias.length === 0) {
    return (
      <div className="text-center py-24">
        <div className="text-3xl mb-3">📊</div>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Todavía no hay resultados de test suficientes</p>
        <p className="text-xs text-gray-400 mt-1">Las gráficas aparecen apenas los usuarios completen el test vocacional.</p>
      </div>
    );
  }

  const labels = categorias.map(c => AREA_LABEL[c] ?? c);

  // Radar: perfil promedio de TODOS los resultados — coloreado según la
  // categoría con mayor promedio (la "inclinación" dominante del grupo).
  const categoriaDominante = categorias.reduce((max, c) =>
    (datos.promedioPorCategoria[c] ?? 0) > (datos.promedioPorCategoria[max] ?? 0) ? c : max, categorias[0]);
  const colorDominante = getAreaChartColor(categoriaDominante);

  const radarData = {
    labels,
    datasets: [{
      label: 'Promedio de afinidad (%)',
      data: categorias.map(c => datos.promedioPorCategoria[c] ?? 0),
      backgroundColor: colorDominante.fill,
      borderColor: colorDominante.line,
      borderWidth: 2,
      pointBackgroundColor: colorDominante.line,
    }],
  };

  // Barras: cuántos usuarios tienen cada categoría como principal —
  // cada barra con el color de familia de SU propia categoría.
  const barData = {
    labels,
    datasets: [{
      label: 'Usuarios con esta categoría como principal',
      data: categorias.map(c => datos.conteoPorCategoria[c] ?? 0),
      backgroundColor: categorias.map(c => getAreaChartColor(c).line),
      borderRadius: 6,
    }],
  };

  const inkColor = getCssVar('--ink-soft', '#67756B');
  const lineColor = getCssVar('--line', '#E6E4DA');

  const radarOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      r: {
        beginAtZero: true,
        ticks: { display: false },
        grid: { color: lineColor },
        angleLines: { color: lineColor },
        pointLabels: { color: inkColor, font: { size: 11 } },
      },
    },
  };

  const barOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: inkColor, font: { size: 10 } }, grid: { display: false } },
      y: { beginAtZero: true, ticks: { color: inkColor, precision: 0 }, grid: { color: lineColor } },
    },
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Analíticas del test vocacional</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Basado en {datos.totalResultados} resultado(s) guardado(s) — se actualiza solo con tests reales completados.
          </p>
        </div>
        <button
          onClick={handleExportar}
          disabled={exportando}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-primary hover:bg-primary-hover text-white transition disabled:opacity-50 flex-shrink-0"
        >
          {exportando ? (
            <><span className="animate-spin inline-block w-3.5 h-3.5 border border-white/60 border-t-white rounded-full" /> Generando...</>
          ) : '⬇ Descargar PDF'}
        </button>
      </div>

      <div ref={contenedorRef} className="flex flex-col gap-5 bg-white dark:bg-[#141a16] p-5 rounded-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="border border-gray-100 dark:border-[#1e2a21] rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1">Perfil promedio (radar)</h3>
            <p className="text-xs text-gray-400 mb-4">% de afinidad promedio por categoría, entre todos los resultados</p>
            <Radar data={radarData} options={radarOptions} />
          </div>

          <div className="border border-gray-100 dark:border-[#1e2a21] rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1">Categoría principal por usuario (barras)</h3>
            <p className="text-xs text-gray-400 mb-4">Cuántos usuarios tienen cada área como su resultado principal</p>
            <Bar data={barData} options={barOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}
