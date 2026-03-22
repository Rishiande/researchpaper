import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Library, BookOpen, BookCheck, Clock, Filter, LayoutGrid, List,
  TrendingUp, RefreshCw, Sparkles, Zap, ArrowRight, BarChart3, Flame,
} from 'lucide-react';
import { getAllPapers, getStats, deletePaper } from '../services/api';
import PaperCard from '../components/PaperCard';
import StatsCard from '../components/StatsCard';
import SearchBar from '../components/SearchBar';
import ConfirmModal from '../components/ConfirmModal';
import { SkeletonCard } from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const FILTERS = [
  { value: '', label: 'All Papers', icon: Library },
  { value: 'not_started', label: 'Not Started', icon: Clock },
  { value: 'reading', label: 'Reading', icon: BookOpen },
  { value: 'completed', label: 'Completed', icon: BookCheck },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good Morning', emoji: '☀️' };
  if (h < 17) return { text: 'Good Afternoon', emoji: '🌤️' };
  if (h < 21) return { text: 'Good Evening', emoji: '🌅' };
  return { text: 'Good Night', emoji: '🌙' };
}

/* ── SVG Circular Progress Ring ──────────── */
function CircularProgress({ percentage }) {
  const [drawn, setDrawn] = useState(false);
  const [display, setDisplay] = useState(0);
  const r = 52;
  const C = 2 * Math.PI * r;

  useEffect(() => {
    const t = setTimeout(() => setDrawn(true), 150);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!percentage) { setDisplay(0); return; }
    let current = 0;
    const inc = percentage / 40;
    const timer = setInterval(() => {
      current += inc;
      if (current >= percentage) { setDisplay(percentage); clearInterval(timer); }
      else setDisplay(Math.floor(current));
    }, 25);
    return () => clearInterval(timer);
  }, [percentage]);

  const offset = C - ((drawn ? percentage : 0) / 100) * C;

  return (
    <div className="relative inline-flex items-center justify-center flex-shrink-0">
      <svg className="w-32 h-32 -rotate-90 drop-shadow-md" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#f1f5f9" strokeWidth="10" />
        <circle cx="60" cy="60" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" strokeDasharray="3 6" opacity="0.4" />
        <circle
          cx="60" cy="60" r={r}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute text-center">
        <span className="text-3xl font-black text-gray-900">{display}<span className="text-lg text-gray-500">%</span></span>
        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">complete</p>
      </div>
    </div>
  );
}

/* ── Segmented Breakdown Bar ─────────────── */
function SegmentedBar({ stats }) {
  const total = stats.total || 1;
  const segments = [
    { value: stats.completed, color: 'bg-emerald-500', label: 'Completed' },
    { value: stats.reading, color: 'bg-amber-500', label: 'Reading' },
    { value: stats.not_started, color: 'bg-slate-300', label: 'Not Started' },
  ];

  return (
    <div className="space-y-2.5">
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
        {segments.map((seg, i) => (
          <div
            key={i}
            className={`${seg.color} transition-all duration-1000 ease-out first:rounded-l-full last:rounded-r-full`}
            style={{ width: `${(seg.value / total) * 100}%` }}
          />
        ))}
      </div>
      <div className="flex items-center gap-4 flex-wrap">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-1.5 text-[11px]">
            <div className={`w-2.5 h-2.5 rounded-full ${seg.color}`} />
            <span className="text-gray-500 font-medium">{seg.label}</span>
            <span className="text-gray-900 font-bold">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Floating Background Orbs ────────────── */
function FloatingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-100/40 rounded-full blur-3xl animate-float-slow" />
      <div className="absolute top-40 -right-32 w-[28rem] h-[28rem] bg-purple-100/30 rounded-full blur-3xl animate-float-slower" style={{ animationDelay: '-4s' }} />
      <div className="absolute -bottom-40 left-1/3 w-80 h-80 bg-pink-100/25 rounded-full blur-3xl animate-float-slow" style={{ animationDelay: '-8s' }} />
      <div className="absolute top-2/3 right-1/4 w-64 h-64 bg-cyan-100/20 rounded-full blur-3xl animate-float-slower" style={{ animationDelay: '-6s' }} />
    </div>
  );
}

export default function Dashboard() {
  const [papers, setPapers] = useState([]);
  const [stats, setStats] = useState({ total: 0, not_started: 0, reading: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('grid');

  const greeting = useMemo(() => getGreeting(), []);

  const fetchData = useCallback(async () => {
    try {
      const params = {};
      if (filter) params.status = filter;
      if (sortBy) params.sort_by = sortBy;
      const [papersRes, statsRes] = await Promise.all([getAllPapers(params), getStats()]);
      setPapers(papersRes.data);
      setStats(statsRes.data);
    } catch {
      toast.error('Failed to load papers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter, sortBy]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRefresh = () => { setRefreshing(true); fetchData(); };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deletePaper(deleteTarget);
      toast.success('Paper deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete paper');
    } finally {
      setDeleteTarget(null);
    }
  };

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  const getFilterCount = (v) => (!v ? stats.total : stats[v] || 0);

  return (
    <div className="relative min-h-[80vh]">
      <FloatingOrbs />

      <div className="relative space-y-8 animate-fade-in">
        {/* ═══════ Hero Section ═══════ */}
        <div className="relative overflow-hidden rounded-3xl glass-premium p-8 md:p-10">
          <div className="absolute inset-0 dot-pattern opacity-40" />
          <div className="absolute inset-0 aurora-bg" />

          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50/80 border border-indigo-100 rounded-full text-xs font-semibold text-indigo-600 animate-slide-down">
                <span>{greeting.emoji}</span>
                <span>{greeting.text}, Researcher</span>
                <Sparkles className="h-3 w-3" />
              </div>

              <h1 className="text-4xl md:text-5xl font-black tracking-tight">
                <span className="text-gradient-animated">Research Library</span>
              </h1>

              <p className="text-gray-500 text-sm md:text-base max-w-lg leading-relaxed">
                Organize, track, and cite your academic research — all in one beautiful place.
              </p>

              {stats.total > 0 && (
                <div className="flex items-center gap-2 text-xs text-gray-400 animate-fade-in-delay">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Live</span>
                  </div>
                  <span>•</span>
                  <span className="font-semibold text-gray-600">{stats.total} papers</span>
                  <span>tracked</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                className={`p-3 glass rounded-2xl text-gray-500 hover:text-indigo-600 hover:bg-indigo-50/80 transition-all duration-300 shadow-sm hover:shadow-md ${refreshing ? 'animate-spin' : ''}`}
                data-tooltip="Refresh"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
              <Link
                to="/papers/add"
                className="group flex items-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_100%] animate-gradient-x text-white text-sm font-bold rounded-2xl hover:shadow-xl hover:shadow-indigo-500/30 transition-all active:scale-95 hover:-translate-y-0.5"
              >
                <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                Add Paper
                <ArrowRight className="h-4 w-4 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
              </Link>
            </div>
          </div>
        </div>

        {/* ═══════ Stats Grid ═══════ */}
        <section>
          <div className="flex items-center gap-2 mb-4 animate-slide-up">
            <BarChart3 className="h-4 w-4 text-indigo-500" />
            <h2 className="text-xs font-bold text-gray-500 tracking-widest uppercase">Overview</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-indigo-200/60 to-transparent" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard label="Total Papers" count={stats.total} type="total" icon={Library} index={0} />
            <StatsCard label="Not Started" count={stats.not_started} type="not_started" icon={Clock} index={1} />
            <StatsCard label="Reading" count={stats.reading} type="reading" icon={BookOpen} index={2} />
            <StatsCard label="Completed" count={stats.completed} type="completed" icon={BookCheck} index={3} />
          </div>
        </section>

        {/* ═══════ Progress Section ═══════ */}
        {stats.total > 0 && (
          <section className="relative overflow-hidden glass-premium rounded-3xl p-6 md:p-8 animate-slide-up">
            <div className="absolute inset-0 aurora-bg opacity-40" />
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shadow-sm">
                    <TrendingUp className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-800">Reading Progress</h3>
                    <p className="text-[11px] text-gray-400">Your research journey at a glance</p>
                  </div>
                </div>
                {completionRate >= 75 && (
                  <div className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-full text-[10px] font-bold text-amber-600 animate-bounce-in">
                    <Flame className="h-3 w-3" />
                    On Fire!
                  </div>
                )}
              </div>

              <div className="flex flex-col md:flex-row items-center gap-8">
                <CircularProgress percentage={completionRate} />
                <div className="flex-1 w-full space-y-5">
                  <SegmentedBar stats={stats} />
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'To Read', value: stats.not_started, icon: Clock, color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-100' },
                      { label: 'In Progress', value: stats.reading, icon: BookOpen, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
                      { label: 'Finished', value: stats.completed, icon: BookCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
                    ].map((item, i) => (
                      <div key={i} className={`${item.bg} border ${item.border} rounded-xl p-3 text-center transition-all hover:scale-105 hover:shadow-sm`}>
                        <item.icon className={`h-4 w-4 ${item.color} mx-auto mb-1.5`} />
                        <p className="text-xl font-black text-gray-900">{item.value}</p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ═══════ Search ═══════ */}
        <SearchBar />

        {/* ═══════ Filter & Controls Bar ═══════ */}
        <div className="glass-premium rounded-2xl p-4 animate-slide-up">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="h-4 w-4 text-indigo-400" />
              {FILTERS.map((f) => {
                const Icon = f.icon;
                const active = filter === f.value;
                const cnt = getFilterCount(f.value);
                return (
                  <button
                    key={f.value}
                    onClick={() => setFilter(f.value)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${
                      active
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25 scale-[1.03]'
                        : 'bg-white/60 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 border border-gray-100 hover:border-indigo-200'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{f.label}</span>
                    <span className={`ml-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                      active ? 'bg-white/20' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {cnt}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs bg-white/80 glass px-3 py-2 rounded-xl border border-gray-100 text-gray-600 font-medium outline-none cursor-pointer hover:border-indigo-200 transition-colors"
              >
                <option value="created_at">Newest first</option>
                <option value="title">Title A-Z</option>
                <option value="publication_year">Year</option>
              </select>
              <div className="flex bg-white/80 glass rounded-xl overflow-hidden border border-gray-100">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2.5 transition-all ${viewMode === 'grid' ? 'bg-indigo-50 text-indigo-600 shadow-inner' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2.5 transition-all ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-600 shadow-inner' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════ Section Header ═══════ */}
        {!loading && papers.length > 0 && (
          <div className="flex items-center gap-2 animate-fade-in">
            <Library className="h-4 w-4 text-indigo-500" />
            <h2 className="text-xs font-bold text-gray-500 tracking-widest uppercase">Your Library</h2>
            <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded-full text-[11px] font-bold text-indigo-600">{papers.length}</span>
            <div className="flex-1 h-px bg-gradient-to-r from-indigo-200/60 to-transparent" />
          </div>
        )}

        {/* ═══════ Papers Grid ═══════ */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : papers.length === 0 ? (
          <div className="relative text-center py-24 animate-fade-in">
            <div className="absolute inset-0 dot-pattern opacity-20 rounded-3xl" />
            <div className="relative">
              <div className="inline-flex p-8 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-[2rem] mb-6 shadow-inner">
                <div className="relative">
                  <Library className="h-14 w-14 text-indigo-300 animate-float" />
                  <Sparkles className="absolute -top-2 -right-2 h-5 w-5 text-amber-400 animate-pulse" />
                </div>
              </div>
              <h3 className="text-xl font-black text-gray-800 mb-2">
                {filter ? 'No papers match this filter' : 'Your library awaits'}
              </h3>
              <p className="text-sm text-gray-500 mb-8 max-w-md mx-auto leading-relaxed">
                {filter
                  ? 'Try changing the filter or add new papers to your collection.'
                  : 'Start building your research library. Add your first paper and begin organizing your academic journey.'}
              </p>
              {!filter && (
                <Link
                  to="/papers/add"
                  className="group inline-flex items-center gap-2.5 px-8 py-3.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_100%] animate-gradient-x text-white text-sm font-bold rounded-2xl hover:shadow-xl hover:shadow-indigo-500/30 transition-all active:scale-95"
                >
                  <Zap className="h-4 w-4" />
                  Add Your First Paper
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5' : 'flex flex-col gap-4'}>
            {papers.map((paper, idx) => (
              <PaperCard key={paper.id} paper={paper} onDelete={setDeleteTarget} index={idx} />
            ))}
          </div>
        )}

        {/* ═══════ Footer Info ═══════ */}
        {!loading && papers.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-gray-400 py-6 animate-fade-in">
            <span>Showing <strong className="text-gray-600">{papers.length}</strong> paper{papers.length !== 1 ? 's' : ''}</span>
            <span className="w-1 h-1 rounded-full bg-gray-300" />
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono text-gray-500">⌘K</kbd>
              to search
            </span>
            <span className="w-1 h-1 rounded-full bg-gray-300" />
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono text-gray-500">+</kbd>
              to add
            </span>
          </div>
        )}

        {/* Delete confirm */}
        <ConfirmModal
          isOpen={!!deleteTarget}
          title="Delete Paper"
          message="This will permanently delete this paper, including all associated notes and uploaded files. This action cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      </div>
    </div>
  );
}
