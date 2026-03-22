import { AlertTriangle, X } from 'lucide-react';
import { useEffect } from 'react';

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmLabel = 'Delete', danger = true }) {
  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Esc to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-md animate-fade-in"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl shadow-gray-900/10 max-w-sm w-full p-7 animate-bounce-in">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all hover:rotate-90"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center text-center">
          {/* Animated icon */}
          <div className={`p-4 rounded-2xl mb-5 ${danger ? 'bg-red-50' : 'bg-amber-50'} animate-wiggle`}>
            <AlertTriangle className={`h-8 w-8 ${danger ? 'text-red-500' : 'text-amber-500'}`} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            {title}
          </h3>
          <p className="text-sm text-gray-500 leading-relaxed max-w-[280px]">
            {message}
          </p>
        </div>

        <div className="flex items-center gap-3 mt-7">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 text-sm font-bold text-white rounded-xl transition-all active:scale-95 shadow-lg ${
              danger
                ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-red-500/25'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-amber-500/25'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
