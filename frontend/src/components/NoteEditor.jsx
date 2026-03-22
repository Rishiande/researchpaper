import { useState, useRef, useEffect } from 'react';
import { Send, X, Type, Hash } from 'lucide-react';

export default function NoteEditor({ onSave, onCancel, initialContent = '' }) {
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [charCount, setCharCount] = useState(initialContent.length);
  const textareaRef = useRef(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleChange = (e) => {
    setContent(e.target.value);
    setCharCount(e.target.value.length);
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    try {
      await onSave(content.trim());
      setContent('');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="animate-slide-up">
      <div className="glass rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all shadow-lg shadow-gray-200/30">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Write your note here... (Ctrl+Enter to save)"
          rows={3}
          className="w-full px-5 py-4 text-sm text-gray-900 placeholder-gray-400 resize-none outline-none bg-transparent"
        />
        <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-gray-50/80 to-indigo-50/30 border-t border-gray-100/50">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Hash className="h-3 w-3" />
              {charCount}
            </span>
            <span className="flex items-center gap-1">
              <Type className="h-3 w-3" />
              {content.trim().split(/\s+/).filter(Boolean).length} words
            </span>
          </div>
          <div className="flex items-center gap-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 hover:bg-white rounded-lg transition-all"
              >
                <X className="h-3.5 w-3.5" />
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={!content.trim() || saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-md shadow-indigo-500/25"
            >
              <Send className="h-3.5 w-3.5" />
              {saving ? 'Saving...' : 'Save Note'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
