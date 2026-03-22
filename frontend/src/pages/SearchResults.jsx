import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, ArrowLeft, TrendingUp, X } from 'lucide-react';
import { searchPapers } from '../services/api';
import PaperCard from '../components/PaperCard';
import SearchBar from '../components/SearchBar';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!query) return;
    const doSearch = async () => {
      setLoading(true);
      try {
        const { data } = await searchPapers(query);
        setResults(data);
        setSearched(true);
      } catch {
        toast.error('Search failed');
      } finally {
        setLoading(false);
      }
    };
    doSearch();
  }, [query]);

  const handleSearch = (q) => {
    setSearchParams({ q });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 transition-colors group mb-3"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to papers
          </Link>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            <span className="text-gradient">Search Results</span>
          </h1>
          {query && (
            <div className="flex items-center gap-2 mt-1.5">
              <p className="text-sm text-gray-500">
                Results for &ldquo;<span className="font-semibold text-gray-700">{query}</span>&rdquo;
              </p>
              <button
                onClick={() => { setSearchParams({}); setResults([]); setSearched(false); }}
                className="p-0.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      <SearchBar initialQuery={query} onSearch={handleSearch} />

      {/* Results */}
      {loading ? (
        <LoadingSpinner message="Searching..." />
      ) : searched && results.length === 0 ? (
        <div className="text-center py-20 animate-fade-in">
          <div className="inline-flex p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl mb-5">
            <Search className="h-10 w-10 text-indigo-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">No results found</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            No papers match &ldquo;<span className="font-semibold">{query}</span>&rdquo;. Try a different search term.
          </p>
        </div>
      ) : results.length > 0 ? (
        <>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <TrendingUp className="h-4 w-4 text-indigo-500" />
            <span>
              <span className="font-semibold text-gray-700">{results.length}</span> result{results.length !== 1 ? 's' : ''} found
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {results.map((paper, idx) => (
              <PaperCard key={paper.id} paper={paper} onDelete={() => {}} index={idx} />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
