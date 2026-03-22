import { useState } from 'react';
import { Copy, Check, Quote, FileCode, BookOpen, GraduationCap } from 'lucide-react';
import { getCitation } from '../services/api';
import toast from 'react-hot-toast';

const FORMATS = [
  { id: 'apa', label: 'APA', icon: GraduationCap, desc: 'American Psychological Association' },
  { id: 'ieee', label: 'IEEE', icon: BookOpen, desc: 'Institute of Electrical and Electronics Engineers' },
  { id: 'bibtex', label: 'BibTeX', icon: FileCode, desc: 'LaTeX bibliography format' },
];

export default function CitationViewer({ paperId }) {
  const [format, setFormat] = useState('');
  const [citation, setCitation] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (fmt) => {
    setFormat(fmt);
    setLoading(true);
    setCitation('');
    try {
      const { data } = await getCitation(paperId, fmt);
      setCitation(data.citation);
    } catch {
      toast.error('Failed to generate citation');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(citation);
      setCopied(true);
      toast.success('Citation copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <div className="space-y-5">
      {/* Format selector cards */}
      <div className="grid grid-cols-3 gap-3">
        {FORMATS.map((f) => {
          const Icon = f.icon;
          const isActive = format === f.id && citation;
          return (
            <button
              key={f.id}
              onClick={() => handleGenerate(f.id)}
              className={`relative p-3 rounded-xl text-left transition-all group ${
                isActive
                  ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-700 hover:shadow-md'
              }`}
            >
              <Icon className={`h-5 w-5 mb-2 ${isActive ? 'text-indigo-200' : 'text-gray-400 group-hover:text-indigo-500'} transition-colors`} />
              <p className="font-bold text-sm">{f.label}</p>
              <p className={`text-[10px] mt-0.5 ${isActive ? 'text-indigo-200' : 'text-gray-400'} line-clamp-1`}>
                {f.desc}
              </p>
              {loading && format === f.id && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-xl">
                  <div className="h-5 w-5 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Citation display */}
      {citation && (
        <div className="relative animate-slide-up">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl blur-sm" />
          <div className="relative bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Quote className="h-4 w-4 text-indigo-500" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {format} Citation
                </span>
              </div>
              <button
                onClick={handleCopy}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
                  copied
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                }`}
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed bg-gray-50 rounded-lg p-4">
              {citation}
            </pre>
          </div>
        </div>
      )}

      {!citation && !loading && (
        <div className="text-center py-6 animate-fade-in">
          <Quote className="h-8 w-8 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400">
            Select a format above to generate a citation
          </p>
        </div>
      )}
    </div>
  );
}
