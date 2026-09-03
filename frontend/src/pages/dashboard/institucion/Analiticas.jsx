import { useEffect, useRef, useState } from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale, CategoryScale, LinearScale,
  PointElement, LineElement, BarElement,
  Filler, Tooltip, Legend,
} from 'chart.js';
import { Radar, Bar } from 'react-chartjs-2';
import DashboardLayout from '../../../components/Layout/DashboardLayout';
import InstitucionNav from './components/InstitucionNav';
import { obtenerPerfil } from '../../../services/perfilService';
import { getAnalytics } from '../../../services/institucionService';
import { AREA_LABEL, getAreaChartColor, getCssVar } from '../../../utils/areaColors';
import { exportarElementoAPDF } from '../../../utils/exportarPDF';

ChartJS.register(RadialLinearScale, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler, Tooltip, Legend);

// Mismo cálculo y mismas gráficas que admin/sections/AnaliticasSection.jsx —
// la única diferencia real es el endpoint (GET /api/institucion/analytics,
// que ya viene scoped a los resultados de estudiantes de ESTA institución,
// el filtro vive en el backend, no acá).
export default function Analiticas({ user }) {
  const [perfil, setPerfil] = useState(null);
  const [datos, setDatos]       = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError]       = useState(null);
  const [exportando, setExportando] = useState(false);
  const contenedorRef = useRef(null);

  useEffect(() => {
    if (user?.id) obtenerPerfil(user.id).then(({ success, data }) => { if (success) setPerfil(data); });
  }, [user?.id]);

  useEffect(() => {
    getAnalytics().then(({ success, data, error: err }) => {
      if (success) setDatos(data);
      else setError(err ?? 'No se pudieron cargar las analíticas.');
      setCargando(false);
    });
  }, []);

  const handleExportar = async () => {
    setExportando(true);
    await exportarElementoAPDF(contenedorRef.current, 'brota-analiticas-institucion.pdf');
    setExportando(false);
  };

  const categorias = datos ? Object.keys({ ...datos.promedioPorCategoria, ...datos.conteoPorCategoria }) : [];

  const labels = categorias.map(c => AREA_LABEL[c] ?? c);
  const categoriaDominante = categorias.length
    ? categorias.reduce((max, c) => (datos.promedioPorCategoria[c] ?? 0) > (datos.promedioPorCategoria[max] ?? 0) ? c : max, categorias[0])
    : null;
  const colorDominante = categoriaDominante ? getAreaChartColor(categoriaDominante) : null;

  const radarData = {
    labels,
    datasets: [{
      label: 'Promedio de afinidad (%)',
      data: categorias.map(c => datos?.promedioPorCategoria[c] ?? 0),
      backgroundColor: colorDominante?.fill,
      borderColor: colorDominante?.line,
      borderWidth: 2,
      pointBackgroundColor: colorDominante?.line,
    }],
  };

  const barData = {
    labels,
    datasets: [{
      label: 'Estudiantes con esta categoría como principal',
      data: categorias.map(c => datos?.conteoPorCategoria[c] ?? 0),
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
    <DashboardLayout profile={perfil}>
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '28px 28px 60px' }}>
        <h1 className="font-display" style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
          Analíticas
        </h1>
        <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 16 }}>
          Perfil vocacional de los estudiantes creados por tu institución — nunca datos de otras instituciones ni del resto de la plataforma.
        </p>

        <InstitucionNav />

        {cargando ? (
          <p style={{ color: 'var(--ink-soft)', fontSize: 14 }} className="animate-pulse">Cargando…</p>
        ) : error || !datos ? (
          <p style={{ fontSize: 13.5, color: '#dc2626' }}>{error ?? 'No hay datos disponibles todavía.'}</p>
        ) : categorias.length === 0 ? (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16, padding: '30px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 30, marginBottom: 8 }}>📊</div>
            <p style={{ fontSize: 13.5, fontWeight: 700 }}>Todavía no hay resultados suficientes</p>
            <p style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 4 }}>
              Las gráficas aparecen apenas tus estudiantes completen el test vocacional.
            </p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
              <button
                onClick={handleExportar}
                disabled={exportando}
                style={{
                  background: 'var(--primary)', color: 'var(--primary-ink)', fontWeight: 700,
                  fontSize: 12.5, padding: '8px 16px', borderRadius: 10, border: 'none',
                  cursor: 'pointer', fontFamily: 'inherit', opacity: exportando ? .6 : 1,
                }}
              >
                {exportando ? 'Generando…' : '⬇ Descargar PDF'}
              </button>
            </div>

            <div ref={contenedorRef} style={{ display: 'grid', gap: 16 }}>
              <p style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                Basado en {datos.totalResultados} resultado(s) de tus estudiantes.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ border: '1px solid var(--line)', borderRadius: 16, padding: 18 }}>
                  <h3 style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 2 }}>Perfil promedio (radar)</h3>
                  <p style={{ fontSize: 11.5, color: 'var(--ink-soft)', marginBottom: 12 }}>% de afinidad promedio por categoría</p>
                  <Radar data={radarData} options={radarOptions} />
                </div>
                <div style={{ border: '1px solid var(--line)', borderRadius: 16, padding: 18 }}>
                  <h3 style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 2 }}>Categoría principal (barras)</h3>
                  <p style={{ fontSize: 11.5, color: 'var(--ink-soft)', marginBottom: 12 }}>Cuántos estudiantes tienen cada área como resultado principal</p>
                  <Bar data={barData} options={barOptions} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
