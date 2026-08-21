// src/components/Shared/Avatar.jsx
export default function Avatar({ name = '', size = 'md' }) {
  const initial = name?.charAt(0)?.toUpperCase() || '?';
  const sizes = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
  };
  return (
    <div className={`${sizes[size]} rounded-full bg-primary text-white font-bold flex items-center justify-center select-none`}>
      {initial}
    </div>
  );
}