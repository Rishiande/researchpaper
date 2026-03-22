import { useState, useEffect, useRef, useMemo } from 'react';

const THEMES = {
  total: {
    gradient: 'from-indigo-600 via-violet-600 to-purple-700',
    shadow: 'shadow-indigo-500/30',
    blob1: '#818cf8', blob2: '#a78bfa', blob3: '#6366f1',
    wave: '#7c3aed',
    particle: '#c4b5fd',
  },
  not_started: {
    gradient: 'from-slate-600 via-slate-700 to-zinc-800',
    shadow: 'shadow-slate-500/30',
    blob1: '#94a3b8', blob2: '#64748b', blob3: '#475569',
    wave: '#334155',
    particle: '#cbd5e1',
  },
  reading: {
    gradient: 'from-amber-500 via-orange-500 to-red-500',
    shadow: 'shadow-orange-500/30',
    blob1: '#fb923c', blob2: '#f97316', blob3: '#ea580c',
    wave: '#c2410c',
    particle: '#fed7aa',
  },
  completed: {
    gradient: 'from-emerald-500 via-teal-500 to-cyan-600',
    shadow: 'shadow-emerald-500/30',
    blob1: '#34d399', blob2: '#2dd4bf', blob3: '#14b8a6',
    wave: '#0d9488',
    particle: '#a7f3d0',
  },
};

/* ── Floating particles (SVG) ────────────── */
function LiveParticles({ color, count = 12 }) {
  const particles = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      cx: Math.random() * 100,
      cy: Math.random() * 100,
      r: 1 + Math.random() * 2.5,
      dur: 4 + Math.random() * 6,
      delay: Math.random() * -8,
      dx: (Math.random() - 0.5) * 30,
      dy: -15 - Math.random() * 25,
    })),
  [count]);

  return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
      {particles.map((p) => (
        <circle key={p.id} r={p.r} fill={color} opacity="0.35">
          <animate
            attributeName="cx"
            values={`${p.cx};${p.cx + p.dx};${p.cx}`}
            dur={`${p.dur}s`}
            begin={`${p.delay}s`}
            repeatCount="indefinite"
          />
          <animate
            attributeName="cy"
            values={`${p.cy};${(p.cy + p.dy + 100) % 100};${p.cy}`}
            dur={`${p.dur}s`}
            begin={`${p.delay}s`}
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0;0.5;0"
            dur={`${p.dur}s`}
            begin={`${p.delay}s`}
            repeatCount="indefinite"
          />
        </circle>
      ))}
    </svg>
  );
}

/* ── Animated wave (SVG) ─────────────────── */
function LiveWave({ color }) {
  return (
    <svg className="absolute bottom-0 left-0 w-full h-[45%] opacity-20" viewBox="0 0 1200 120" preserveAspectRatio="none">
      <path fill={color}>
        <animate
          attributeName="d"
          dur="4s"
          repeatCount="indefinite"
          values="
            M0,80 C200,120 400,40 600,80 C800,120 1000,40 1200,80 L1200,120 L0,120 Z;
            M0,60 C200,20 400,100 600,60 C800,20 1000,100 1200,60 L1200,120 L0,120 Z;
            M0,80 C200,120 400,40 600,80 C800,120 1000,40 1200,80 L1200,120 L0,120 Z"
        />
      </path>
      <path fill={color} opacity="0.5">
        <animate
          attributeName="d"
          dur="6s"
          repeatCount="indefinite"
          values="
            M0,90 C300,60 500,110 700,80 C900,50 1100,100 1200,70 L1200,120 L0,120 Z;
            M0,70 C300,100 500,50 700,90 C900,110 1100,60 1200,90 L1200,120 L0,120 Z;
            M0,90 C300,60 500,110 700,80 C900,50 1100,100 1200,70 L1200,120 L0,120 Z"
        />
      </path>
    </svg>
  );
}

/* ── Floating blobs (CSS) ────────────────── */
function LiveBlobs({ blob1, blob2, blob3 }) {
  return (
    <>
      <div
        className="absolute rounded-full mix-blend-overlay filter blur-xl opacity-30 animate-blob"
        style={{ width: 80, height: 80, top: '-10%', left: '10%', backgroundColor: blob1 }}
      />
      <div
        className="absolute rounded-full mix-blend-overlay filter blur-xl opacity-25 animate-blob"
        style={{ width: 60, height: 60, top: '40%', right: '-5%', backgroundColor: blob2, animationDelay: '-2s' }}
      />
      <div
        className="absolute rounded-full mix-blend-overlay filter blur-xl opacity-20 animate-blob"
        style={{ width: 50, height: 50, bottom: '-10%', left: '40%', backgroundColor: blob3, animationDelay: '-4s' }}
      />
    </>
  );
}

/* ── Animated counter ────────────────────── */
function AnimatedCount({ target }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    const duration = 800;
    const steps = 30;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(current));
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target]);

  return <span ref={ref}>{count}</span>;
}

/* ── Main component ──────────────────────── */
export default function StatsCard({ label, count, type = 'total', icon: Icon, index = 0 }) {
  const theme = THEMES[type] || THEMES.total;
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`
        relative overflow-hidden rounded-2xl p-5
        bg-gradient-to-br ${theme.gradient}
        shadow-xl ${theme.shadow}
        hover-lift group cursor-default
        animate-slide-up
      `}
      style={{ animationDelay: `${index * 0.08}s`, animationFillMode: 'both' }}
    >
      {/* === Live animated background layers === */}
      <LiveBlobs blob1={theme.blob1} blob2={theme.blob2} blob3={theme.blob3} />
      <LiveParticles color={theme.particle} />
      <LiveWave color={theme.wave} />

      {/* Shimmer sweep on hover */}
      <div
        className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 ${
          hovered ? 'translate-x-full' : '-translate-x-full'
        }`}
      />

      {/* Large ghost icon */}
      <div className="absolute -bottom-3 -right-3 opacity-[0.07] group-hover:opacity-[0.12] group-hover:scale-110 transition-all duration-500">
        <Icon className="h-24 w-24 text-white" />
      </div>

      {/* === Content === */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-sm group-hover:bg-white/25 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-black/5">
            <Icon className="h-4.5 w-4.5 text-white" />
          </div>
          {count > 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-white/15 backdrop-blur-sm rounded-full text-[10px] font-bold text-white/80 animate-fade-in">
              <div className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />
              active
            </div>
          )}
        </div>

        <p className="text-4xl font-black text-white tracking-tight drop-shadow-sm group-hover:scale-105 transition-transform duration-300 origin-left">
          <AnimatedCount target={count} />
        </p>

        <div className="flex items-center justify-between mt-1.5">
          <p className="text-white/60 text-xs font-semibold tracking-wider uppercase">{label}</p>
          <div className="h-1 w-8 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full rounded-full bg-white/60 transition-all duration-1000"
              style={{ width: count > 0 ? '100%' : '0%' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
