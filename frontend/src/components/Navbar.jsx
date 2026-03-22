import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, Plus, Search, X, Command, Home, Sparkles, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // Detect scroll for glass effect
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Keyboard shortcut: Ctrl+K to open search
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setQuery('');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setQuery('');
      setSearchOpen(false);
    }
  };

  return (
    <>
      <nav
        className={`sticky top-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'glass-dark shadow-lg shadow-indigo-500/5'
            : 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="bg-white/15 p-2 rounded-xl group-hover:bg-white/25 transition-all duration-300 group-hover:rotate-[-6deg] group-hover:scale-110">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-emerald-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity animate-pulse-glow" />
              </div>
              <div className="hidden sm:block">
                <span className="text-white font-bold text-lg tracking-tight block leading-tight">
                  Research Paper
                </span>
                <span className="text-indigo-200 text-[10px] font-medium tracking-widest uppercase">
                  Organizer
                </span>
              </div>
              <span className="text-white font-bold text-lg tracking-tight sm:hidden">
                RPO
              </span>
            </Link>

            {/* Center nav links (desktop) */}
            <div className="hidden md:flex items-center gap-1 bg-white/10 rounded-xl p-1">
              <Link
                to="/"
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  location.pathname === '/'
                    ? 'bg-white/20 text-white shadow-sm'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <Home className="h-3.5 w-3.5" />
                Library
              </Link>
              <Link
                to="/papers/add"
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  location.pathname === '/papers/add'
                    ? 'bg-white/20 text-white shadow-sm'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Add Paper
              </Link>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Search trigger */}
              <button
                onClick={() => {
                  setSearchOpen(true);
                  setTimeout(() => inputRef.current?.focus(), 50);
                }}
                className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white/80 hover:text-white text-sm transition-all group"
                data-tooltip="Ctrl+K to search"
              >
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline text-white/60 group-hover:text-white/80">Search...</span>
                <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-white/10 rounded text-[10px] font-mono text-white/50">
                  <Command className="h-2.5 w-2.5" />K
                </kbd>
              </button>

              {/* Add Paper CTA */}
              <Link
                to="/papers/add"
                className="md:hidden flex items-center gap-2 bg-white text-indigo-700 px-4 py-2 rounded-xl font-semibold text-sm hover:bg-indigo-50 hover:shadow-lg hover:shadow-indigo-500/20 transition-all active:scale-95 group"
              >
                <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
              </Link>
              <Link
                to="/papers/add"
                className="hidden md:flex items-center gap-2 bg-white text-indigo-700 px-5 py-2 rounded-xl font-semibold text-sm hover:bg-indigo-50 hover:shadow-lg hover:shadow-indigo-500/20 transition-all active:scale-95 group"
              >
                <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
                <span>Add Paper</span>
              </Link>

              {/* User avatar & logout */}
              {user && (
                <div className="flex items-center gap-2 ml-1">
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-xl">
                    <User className="h-3.5 w-3.5 text-white/70" />
                    <span className="text-white/80 text-sm font-medium truncate max-w-[120px]">{user.full_name}</span>
                  </div>
                  <button
                    onClick={() => { logout(); navigate('/login'); }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-red-500/80 rounded-xl text-white/70 hover:text-white text-sm transition-all"
                    title="Sign out"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Full search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh]">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => { setSearchOpen(false); setQuery(''); }}
          />
          <div className="relative w-full max-w-xl mx-4 animate-slide-down">
            <form onSubmit={handleSearch}>
              <div className="bg-white rounded-2xl shadow-2xl shadow-indigo-500/10 overflow-hidden border border-gray-100">
                <div className="flex items-center gap-3 px-5 py-4">
                  <Search className="h-5 w-5 text-indigo-500 flex-shrink-0" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search papers by title, author, or keyword..."
                    className="flex-1 text-gray-900 text-base placeholder-gray-400 outline-none bg-transparent"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => { setSearchOpen(false); setQuery(''); }}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    Press <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-[10px] font-mono">Enter</kbd> to search
                  </span>
                  <span className="text-xs text-gray-400">
                    <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-[10px] font-mono">Esc</kbd> to close
                  </span>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
