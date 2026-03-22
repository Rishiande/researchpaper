import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Download, Pencil, Trash2, Calendar, Users, Book, Globe, Tag,
  FileText, MessageSquare, Quote, StickyNote, CheckCircle2, Loader2, ExternalLink
} from 'lucide-react';
import { getPaper, updatePaper, updateStatus, deletePaper, getNotes, createNote, updateNote, deleteNote, getDownloadUrl } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import NoteEditor from '../components/NoteEditor';
import NoteItem from '../components/NoteItem';
import CitationViewer from '../components/CitationViewer';
import ConfirmModal from '../components/ConfirmModal';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'overview', label: 'Overview', icon: Book },
  { id: 'notes', label: 'Notes', icon: StickyNote },
  { id: 'citations', label: 'Citations', icon: Quote },
];

const STATUSES = ['not_started', 'reading', 'completed'];

export default function PaperDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [paper, setPaper] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [showDelete, setShowDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const fetchPaper = useCallback(async () => {
    try {
      const [paperRes, notesRes] = await Promise.all([
        getPaper(id),
        getNotes(id),
      ]);
      setPaper(paperRes.data);
      setNotes(notesRes.data);
      setEditForm({
        title: paperRes.data.title || '',
        authors: paperRes.data.authors || '',
        publication_year: paperRes.data.publication_year || '',
        journal: paperRes.data.journal || '',
        doi: paperRes.data.doi || '',
        abstract: paperRes.data.abstract || '',
        keywords: paperRes.data.keywords || '',
      });
    } catch {
      toast.error('Paper not found');
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { fetchPaper(); }, [fetchPaper]);

  const cycleStatus = async () => {
    const idx = STATUSES.indexOf(paper.reading_status);
    const next = STATUSES[(idx + 1) % STATUSES.length];
    try {
      await updateStatus(id, next);
      setPaper((p) => ({ ...p, reading_status: next }));
      toast.success(`Status → ${next.replace('_', ' ')}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(editForm).forEach(([k, v]) => fd.append(k, v || ''));
      await updatePaper(id, fd);
      await fetchPaper();
      setEditing(false);
      toast.success('Paper updated');
    } catch {
      toast.error('Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deletePaper(id);
      toast.success('Paper deleted');
      navigate('/');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleAddNote = async (content) => {
    await createNote(id, content);
    const { data } = await getNotes(id);
    setNotes(data);
    toast.success('Note added');
  };

  const handleUpdateNote = async (noteId, content) => {
    await updateNote(noteId, content);
    const { data } = await getNotes(id);
    setNotes(data);
    toast.success('Note updated');
  };

  const handleDeleteNote = async (noteId) => {
    await deleteNote(noteId);
    setNotes((n) => n.filter((x) => x.id !== noteId));
    toast.success('Note deleted');
  };

  if (loading) return <LoadingSpinner fullPage message="Loading paper..." />;
  if (!paper) return null;

  const keywords = paper.keywords ? paper.keywords.split(',').map((k) => k.trim()).filter(Boolean) : [];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Back nav */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 transition-colors group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        Back to papers
      </Link>

      {/* Header card */}
      <div className="glass rounded-3xl p-7 animate-slide-up">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-extrabold text-gray-900 leading-tight mb-2">
              {paper.title}
            </h1>
            {paper.authors && (
              <p className="flex items-center gap-1.5 text-sm text-gray-500 mb-1">
                <Users className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="line-clamp-2">{paper.authors}</span>
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mt-2">
              {paper.publication_year && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {paper.publication_year}
                </span>
              )}
              {paper.journal && (
                <span className="flex items-center gap-1">
                  <Book className="h-3 w-3" />
                  {paper.journal}
                </span>
              )}
              {paper.doi && (
                <a
                  href={`https://doi.org/${paper.doi}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-indigo-500 hover:text-indigo-700"
                >
                  <Globe className="h-3 w-3" />
                  {paper.doi}
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <StatusBadge status={paper.reading_status} size="lg" onClick={cycleStatus} />
            {paper.pdf_filename && (
              <a
                href={getDownloadUrl(id)}
                className="p-2.5 glass rounded-xl text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                data-tooltip="Download PDF"
              >
                <Download className="h-4 w-4" />
              </a>
            )}
            <button
              onClick={() => setEditing(!editing)}
              className={`p-2.5 glass rounded-xl transition-all ${editing ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50'}`}
              data-tooltip="Edit"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowDelete(true)}
              className="p-2.5 glass rounded-xl text-gray-500 hover:text-red-500 hover:bg-red-50 transition-all"
              data-tooltip="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Keywords */}
        {keywords.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {keywords.map((kw, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-600 rounded-lg text-xs font-medium border border-indigo-100/50"
              >
                <Tag className="h-3 w-3" />
                {kw}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Edit panel */}
      {editing && (
        <form onSubmit={handleEdit} className="glass rounded-2xl p-6 space-y-4 animate-slide-down">
          <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <Pencil className="h-4 w-4 text-indigo-500" />
            Edit Paper
          </h3>
          {['title', 'authors', 'journal', 'doi', 'keywords'].map((field) => (
            <div key={field}>
              <label className="block text-xs font-semibold text-gray-500 mb-1 capitalize">
                {field.replace('_', ' ')}
              </label>
              <input
                type="text"
                value={editForm[field]}
                onChange={(e) => setEditForm((f) => ({ ...f, [field]: e.target.value }))}
                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Year</label>
              <input
                type="number"
                value={editForm.publication_year}
                onChange={(e) => setEditForm((f) => ({ ...f, publication_year: e.target.value }))}
                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Abstract</label>
            <textarea
              value={editForm.abstract}
              onChange={(e) => setEditForm((f) => ({ ...f, abstract: e.target.value }))}
              rows={4}
              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none resize-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setEditing(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-all">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold rounded-xl disabled:opacity-50 transition-all active:scale-95 shadow-md"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}

      {/* Tabs */}
      <div className="flex gap-1 glass rounded-2xl p-1.5">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          const count = t.id === 'notes' ? notes.length : null;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-white text-indigo-700 shadow-md'
                  : 'text-gray-500 hover:text-indigo-600 hover:bg-white/50'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
              {count != null && count > 0 && (
                <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-bold ${isActive ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="min-h-[200px]">
        {/* Overview */}
        {tab === 'overview' && (
          <div className="glass rounded-2xl p-7 space-y-5 animate-fade-in">
            {paper.abstract ? (
              <>
                <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-indigo-500" />
                  Abstract
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">{paper.abstract}</p>
              </>
            ) : (
              <div className="text-center py-10">
                <FileText className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No abstract available</p>
              </div>
            )}

            {paper.pdf_filename && (
              <div className="flex items-center gap-3 p-4 bg-indigo-50/50 rounded-xl">
                <FileText className="h-5 w-5 text-indigo-500" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">{paper.pdf_filename}</p>
                  <p className="text-xs text-gray-400">Uploaded PDF</p>
                </div>
                <a
                  href={getDownloadUrl(id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-all"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </a>
              </div>
            )}

            <div className="text-xs text-gray-400 pt-4 border-t border-gray-100">
              Added {new Date(paper.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              {paper.updated_at !== paper.created_at && (
                <> &middot; Updated {new Date(paper.updated_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        {tab === 'notes' && (
          <div className="space-y-5 animate-fade-in">
            <NoteEditor onSave={handleAddNote} />
            {notes.length > 0 ? (
              <div className="space-y-3">
                {notes.map((note, idx) => (
                  <NoteItem
                    key={note.id}
                    note={note}
                    index={idx}
                    onUpdate={handleUpdateNote}
                    onDelete={handleDeleteNote}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-10 animate-fade-in">
                <MessageSquare className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No notes yet. Add your first note above.</p>
              </div>
            )}
          </div>
        )}

        {/* Citations */}
        {tab === 'citations' && (
          <div className="glass rounded-2xl p-7 animate-fade-in">
            <CitationViewer paperId={paper.id} />
          </div>
        )}
      </div>

      {/* Delete modal */}
      <ConfirmModal
        isOpen={showDelete}
        title="Delete Paper"
        message="This will permanently delete this paper and all its notes. This cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  );
}
