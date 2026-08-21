// src/pages/dashboard/components/QuickActions.jsx
import { useNavigate } from 'react-router-dom';

const ACTIONS = [
  {
    icon: '🧭',
    title: 'Explorar profesiones',
    desc: 'Descubre carreras que se alinean contigo',
    to: '/dashboard/profesiones',
    color: 'bg-primary-soft dark:bg-[#111c14]',
    iconBg: 'bg-primary-soft dark:bg-[#14532d]',
  },
  {
    icon: '✅',
    title: 'Realizar test vocacional',
    desc: 'Conoce tus intereses, habilidades y fortalezas',
    to: '/dashboard/test',
    color: 'bg-teal-50 dark:bg-[#042f2e]',
    iconBg: 'bg-teal-100 dark:bg-[#134e4a]',
  },
  {
    icon: '🗺️',
    title: 'Conocer rutas formativas',
    desc: 'Encuentra caminos educativos para tu futuro',
    to: '/dashboard/rutas',
    color: 'bg-amber-50 dark:bg-[#2d1a00]',
    iconBg: 'bg-amber-100 dark:bg-[#422006]',
  },
  {
    icon: '📖',
    title: 'Explorar recursos',
    desc: 'Guías, videos y herramientas para orientarte mejor',
    to: '/dashboard/recursos',
    color: 'bg-blue-50 dark:bg-[#0c1a2e]',
    iconBg: 'bg-blue-100 dark:bg-[#1e3a5f]',
  },
];

export default function QuickActions() {
  const navigate = useNavigate();

  return (
    <div>
      <h2 className="text-base font-semibold text-gray-800 mb-3">
        ¿Qué te gustaría hacer hoy?
      </h2>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {ACTIONS.map(({ icon, title, desc, to, color, iconBg }) => (
          <button
            key={to}
            onClick={() => navigate(to)}
            className={`${color} rounded-2xl p-5 text-left border border-transparent hover:border-primary/25 hover:shadow-sm transition-all duration-200 group`}
          >
            <div className={`${iconBg} w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3`}>
              {icon}
            </div>
            <p className="text-sm font-semibold text-gray-800 leading-snug mb-1">{title}</p>
            <p className="text-xs text-gray-500 leading-snug mb-3">{desc}</p>
            <span className="text-primary text-lg group-hover:translate-x-1 inline-block transition-transform duration-200">→</span>
          </button>
        ))}
      </div>
    </div>
  );
}
