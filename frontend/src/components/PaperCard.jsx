import { useNavigate } from 'react-router-dom';
import { Calendar, Tag, FileText, Trash2, ArrowUpRight, BookmarkCheck } from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function PaperCard({ paper, onDelete, index = 0 }) {
  const navigate = useNavigate();

  const keywords = paper.keywords
    ? paper.keywords.split(',').map((k) => k.trim()).filter(Boolean).slice(0, 3)
    : [];

  return (
    <div
      onClick={() => navigate(`/papers/${paper.id}`)}
      className="group relative bg-white/80 glass rounded-2xl hover-lift cursor-pointer overflow-hidden flex flex-col card-glow animate-slide-up"
      style={{ animationDelay: `${index * 0.06}s`, animationFillMode: 'both' }}
    >
      {/* Animated gradient top bar */}
      <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-[length:200%_200%] animate-gradient-x scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />

      <div className="p-5 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-indigo-700 transition-colors duration-300">
            {paper.title}
          </h3>
          <StatusBadge status={paper.reading_status} size="sm" />
        </div>

        {/* Authors */}
        <p className="text-xs text-gray-500 mb-3 line-clamp-1 group-hover:text-gray-600 transition-colors">
          {paper.authors}
        </p>

        {/* Meta row */}
        <div className="flex items-center gap-2 flex-wrap text-xs text-gray-400 mb-3">
          {paper.publication_year && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-50 rounded-md">
              <Calendar className="h-3 w-3" />
              {paper.publication_year}
            </span>
          )}
          {paper.pdf_filename && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-500 rounded-md">
              <FileText className="h-3 w-3" />
              PDF
            </span>
          )}
          {paper.reading_status === 'completed' && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-500 rounded-md">
              <BookmarkCheck className="h-3 w-3" />
              Done
            </span>
          )}
        </div>

        {/* Keywords */}
        {keywords.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {keywords.map((kw, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-600 rounded-lg text-[11px] font-medium border border-indigo-100/50 group-hover:border-indigo-200 transition-colors"
              >
                <Tag className="h-2.5 w-2.5" />
                {kw}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto pt-3 border-t border-gray-100/50 flex items-center justify-between">
          <span className="text-[11px] text-gray-400 font-medium">
            {new Date(paper.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(paper.id);
              }}
              className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
              data-tooltip="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            <div className="p-1.5 text-gray-300 group-hover:text-indigo-500 transition-all opacity-0 group-hover:opacity-100">
              <ArrowUpRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
