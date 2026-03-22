import { useState, useRef, useEffect } from 'react';
import { Search, X, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SearchBar({ initialQuery = '', onSearch, inline = false }) {
  const [query, setQuery] = useState(initialQuery);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    if (onSearch) {
      onSearch(query.trim());
    } else {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={inline ? '' : 'w-full max-w-2xl mx-auto'}>
      <div
        className={`relative transition-all duration-300 ${
          focused ? 'scale-[1.02]' : 'scale-100'
        }`}
      >
        {/* Glow effect */}
        <div
          className={`absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl opacity-0 blur-lg transition-opacity duration-300 ${
            focused ? 'opacity-20' : ''
          }`}
        />
        <div className="relative">
          <Search className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors duration-200 ${focused ? 'text-indigo-500' : 'text-gray-400'}`} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Search by title, author, or keyword..."
            className="w-full pl-12 pr-24 py-3.5 bg-white/90 glass border-0 rounded-xl text-sm text-gray-900 placeholder-gray-400 shadow-lg shadow-gray-200/50 focus:shadow-indigo-200/50 outline-none transition-all"
          />
          {query ? (
            <button
              type="button"
              onClick={() => { setQuery(''); inputRef.current?.focus(); }}
              className="absolute right-14 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all active:scale-95 shadow-md shadow-indigo-500/30"
          >
            <Sparkles className="h-3 w-3" />
            Search
          </button>
        </div>
      </div>
    </form>
  );
}
