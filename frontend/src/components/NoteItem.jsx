import { useState } from 'react';
import { Pencil, Trash2, Clock, MessageSquare } from 'lucide-react';
import NoteEditor from './NoteEditor';

export default function NoteItem({ note, onUpdate, onDelete, index = 0 }) {
  const [editing, setEditing] = useState(false);

  const handleUpdate = async (content) => {
    await onUpdate(note.id, content);
    setEditing(false);
  };

  if (editing) {
    return (
      <NoteEditor
        initialContent={note.content}
        onSave={handleUpdate}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div
      className="group relative bg-white/70 glass rounded-2xl p-5 hover:bg-white transition-all animate-slide-up"
      style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'both' }}
    >
      {/* Left accent */}
      <div className="absolute left-0 top-4 bottom-4 w-0.5 bg-gradient-to-b from-indigo-400 to-purple-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-start gap-3">
        <div className="p-2 bg-indigo-50 rounded-xl text-indigo-500 flex-shrink-0 mt-0.5 group-hover:bg-indigo-100 transition-colors">
          <MessageSquare className="h-3.5 w-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {note.content}
          </p>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100/50">
            <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
              <Clock className="h-3 w-3" />
              {new Date(note.updated_at).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
              <button
                onClick={() => setEditing(true)}
                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all hover:scale-110"
                data-tooltip="Edit"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onDelete(note.id)}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all hover:scale-110"
                data-tooltip="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
