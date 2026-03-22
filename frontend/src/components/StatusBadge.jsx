const STATUS_CONFIG = {
  not_started: {
    label: 'Not Started',
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    dot: 'bg-gray-400',
    hoverBg: 'hover:bg-gray-200',
    ring: 'ring-gray-300',
  },
  reading: {
    label: 'Reading',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-400',
    hoverBg: 'hover:bg-amber-100',
    ring: 'ring-amber-300',
  },
  completed: {
    label: 'Completed',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    dot: 'bg-emerald-400',
    hoverBg: 'hover:bg-emerald-100',
    ring: 'ring-emerald-300',
  },
};

export default function StatusBadge({ status, size = 'md', onClick }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.not_started;
  const sizeClasses = size === 'sm'
    ? 'px-2.5 py-0.5 text-[11px]'
    : size === 'lg'
    ? 'px-4 py-1.5 text-sm'
    : 'px-3 py-1 text-xs';

  return (
    <span
      onClick={onClick}
      className={`
        inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap
        ${config.bg} ${config.text} ${sizeClasses}
        ${onClick ? `cursor-pointer ${config.hoverBg} active:scale-95 ring-1 ${config.ring} transition-all` : ''}
        animate-scale-in
      `}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot} ${onClick ? 'animate-pulse' : ''}`} />
      {config.label}
      {onClick && (
        <svg className="h-3 w-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
        </svg>
      )}
    </span>
  );
}

export { STATUS_CONFIG };
