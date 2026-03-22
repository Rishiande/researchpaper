import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import {
  Upload, FileText, X, Search, CheckCircle2, Loader2,
  ChevronRight, ChevronLeft, Sparkles, Tag, Calendar, Users, Book, Globe,
  ArrowRight, Zap, Paperclip, Check, AlertCircle, Eye, RotateCcw, Shield, Hash
} from 'lucide-react';
import { createPaper, resolveDOI } from '../services/api';
import toast from 'react-hot-toast';

/* ─── Step definitions ─────────────────────── */
const STEPS = [
  { id: 0, label: 'Source', desc: 'DOI or manual', icon: Zap },
  { id: 1, label: 'Details', desc: 'Paper metadata', icon: Book },
  { id: 2, label: 'Upload', desc: 'PDF & status', icon: Paperclip },
  { id: 3, label: 'Review', desc: 'Confirm & save', icon: Eye },
];

const STATUSES = [
  { value: 'not_started', label: 'Not Started', icon: '📋', desc: "Haven't started reading yet", color: 'from-slate-500 to-slate-600', accent: 'slate' },
  { value: 'reading', label: 'Reading', icon: '📖', desc: 'Currently reading this paper', color: 'from-amber-500 to-orange-500', accent: 'amber' },
  { value: 'completed', label: 'Completed', icon: '✅', desc: 'Finished reading', color: 'from-emerald-500 to-teal-500', accent: 'emerald' },
];

/* ─── Animated step indicator ──────────────── */
function StepProgress({ current, steps }) {
  return (
    <div className="flex items-center justify-between w-full max-w-xl mx-auto px-2">
      {steps.map((step, i) => {
        const Icon = step.icon;
        const isDone = i < current;
        const isActive = i === current;
        const isLast = i === steps.length - 1;
        return (
          <div key={step.id} className="flex items-center flex-1 last:flex-initial">
            <div className="relative flex flex-col items-center">
              {/* Circle node */}
              <div
                className={`
                  relative z-10 flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-500
                  ${isDone
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 ring-2 ring-indigo-200/50'
                    : isActive
                    ? 'bg-gradient-to-br from-indigo-50 to-purple-50 shadow-xl shadow-indigo-500/15 scale-110 ring-[3px] ring-indigo-400/60'
                    : 'bg-white shadow-sm ring-2 ring-gray-200/80'}
                `}
              >
                {isDone ? (
                  <Check className="h-4 w-4 text-white animate-scale-in" />
                ) : (
                  <Icon className={`h-4 w-4 transition-colors ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                )}
                {isActive && <div className="absolute -inset-1 rounded-xl bg-indigo-400/10 animate-pulse" />}
              </div>
              <span className={`mt-2 text-[10px] font-bold transition-colors ${isDone ? 'text-indigo-600' : isActive ? 'text-indigo-700' : 'text-gray-400'}`}>
                {step.label}
              </span>
              <span className={`text-[8px] font-semibold transition-all ${isDone ? 'text-indigo-400' : isActive ? 'text-gray-500' : 'text-gray-300'}`}>
                {step.desc}
              </span>
            </div>
            {!isLast && (
              <div className="flex-1 mx-2 h-[3px] rounded-full bg-gray-100 relative overflow-hidden mt-[-18px]">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700 ease-out"
                  style={{ width: isDone ? '100%' : isActive ? '40%' : '0%' }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Floating label input ─────────────────── */
function FloatingInput({ label, icon: Icon, required, value, onChange, type = 'text', placeholder = '', rows, className = '', ...rest }) {
  const [focused, setFocused] = useState(false);
  const isTextarea = rows != null;
  const filled = value && value.length > 0;
  const Comp = isTextarea ? 'textarea' : 'input';
  const hasIcon = !!Icon;

  return (
    <div className={`relative group transition-all duration-300 ${focused ? 'scale-[1.01]' : ''} ${className}`}>
      {focused && (
        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl blur-sm" />
      )}
      <div className="relative">
        {Icon && (
          <Icon
            className={`absolute left-4 h-4 w-4 transition-colors duration-200 z-10 ${
              isTextarea ? 'top-4' : 'top-1/2 -translate-y-1/2'
            } ${focused ? 'text-indigo-500' : filled ? 'text-emerald-400' : 'text-gray-300'}`}
          />
        )}
        <Comp
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={focused ? placeholder : ' '}
          rows={rows}
          className={`
            w-full pr-10 ${isTextarea ? 'py-5 pt-6' : 'py-4'}
            ${hasIcon ? 'pl-11' : 'pl-4'}
            bg-white border-2 rounded-xl text-sm text-gray-900 placeholder-gray-300
            outline-none transition-all duration-200
            ${focused
              ? 'border-indigo-400 shadow-lg shadow-indigo-500/10'
              : filled
              ? 'border-emerald-300 bg-emerald-50/30'
              : 'border-gray-200 hover:border-gray-300'}
            ${isTextarea ? 'resize-none' : ''}
          `}
          {...rest}
        />
        <span
          className={`
            absolute transition-all duration-200 pointer-events-none font-medium z-10
            ${hasIcon ? 'left-11' : 'left-4'}
            ${focused || filled
              ? '-top-2.5 text-[10px] px-1.5 py-0 bg-white rounded ' + (focused ? 'text-indigo-600' : 'text-emerald-600')
              : `${isTextarea ? 'top-5' : 'top-1/2 -translate-y-1/2'} text-sm text-gray-400`}
          `}
        >
          {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        </span>
        {filled && !focused && (
          <CheckCircle2 className={`absolute right-3 h-4 w-4 text-emerald-400 animate-scale-in ${isTextarea ? 'top-4' : 'top-1/2 -translate-y-1/2'}`} />
        )}
      </div>
    </div>
  );
}

/* ─── Completeness mini-ring ───────────────── */
function MiniRing({ filled, total }) {
  const pct = total > 0 ? (filled / total) * 100 : 0;
  const r = 14;
  const C = 2 * Math.PI * r;
  const offset = C - (pct / 100) * C;
  return (
    <div className="relative flex items-center justify-center">
      <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r={r} fill="none" stroke="#f1f5f9" strokeWidth="3" />
        <circle cx="18" cy="18" r={r} fill="none" stroke="url(#miniGrad)" strokeWidth="3" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
        <defs><linearGradient id="miniGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#6366f1" /><stop offset="100%" stopColor="#a855f7" /></linearGradient></defs>
      </svg>
      <span className="absolute text-[8px] font-black text-indigo-600">{filled}</span>
    </div>
  );
}

/* ═════════ Main Component ═════════ */
export default function AddPaper() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    title: '', authors: '', publication_year: '', journal: '',
    doi: '', abstract: '', keywords: '', reading_status: 'not_started',
  });
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [direction, setDirection] = useState(1);

  const [doiInput, setDoiInput] = useState('');
  const [resolving, setResolving] = useState(false);
  const [resolved, setResolved] = useState(false);
  const [resolveError, setResolveError] = useState('');

  const contentRef = useRef(null);
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const goNext = () => { setDirection(1); setStep((s) => Math.min(s + 1, 3)); };
  const goBack = () => { setDirection(-1); setStep((s) => Math.max(s - 1, 0)); };

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        if (step < 3) goNext();
        else document.querySelector('[data-submit]')?.click();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [step]);

  const onDrop = useCallback((accepted) => {
    if (accepted.length) setFile(accepted[0]);
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024,
  });

  const handleResolve = async () => {
    if (!doiInput.trim()) return;
    setResolving(true);
    setResolved(false);
    setResolveError('');
    try {
      const { data } = await resolveDOI(doiInput.trim());
      const meta = data.metadata || data;
      setForm((f) => ({
        ...f,
        title: meta.title || f.title,
        authors: Array.isArray(meta.authors) ? meta.authors.join(', ') : meta.authors || f.authors,
        publication_year: (meta.publication_year ?? meta.year)?.toString() || f.publication_year,
        journal: meta.journal || f.journal,
        doi: meta.doi || doiInput.trim(),
        abstract: meta.abstract || f.abstract,
      }));
      setResolved(true);
      toast.success('DOI resolved! Fields auto-filled.');
      setTimeout(() => { setDirection(1); setStep(1); }, 800);
    } catch {
      setResolveError('Could not resolve this DOI. You can enter details manually.');
      toast.error('DOI resolution failed');
    } finally {
      setResolving(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error('Title is required');
      setDirection(-1);
      setStep(1);
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      if (file) fd.append('pdf_file', file);
      await createPaper(fd);
      toast.success('Paper added successfully!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add paper');
    } finally {
      setSubmitting(false);
    }
  };

  const formFields = Object.entries(form).filter(([k]) => k !== 'reading_status');
  const filledFields = formFields.filter(([, v]) => v && v.length > 0).length;
  const filledCount = filledFields + (file ? 1 : 0);

  return (
    <div className="max-w-3xl mx-auto animate-fade-in mt-2">
      {/* ═══════ Single Outer Card ═══════ */}
      <div className="relative rounded-[2rem] glass-premium shadow-2xl shadow-indigo-500/8">
        {/* Background decorations (clipped separately) */}
        <div className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none">
          <div className="absolute inset-0 dot-pattern opacity-20" />
          <div className="absolute -top-32 -right-32 w-80 h-80 bg-indigo-100/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-72 h-72 bg-purple-100/25 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-50/20 rounded-full blur-3xl" />
        </div>

        {/* ─── Card Header ─── */}
        <div className="relative px-8 pt-7 pb-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl shadow-lg shadow-indigo-500/25">
                <Sparkles className="h-4.5 w-4.5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-black text-gray-900 tracking-tight">Add New Paper</h1>
                <p className="text-[11px] text-gray-400 mt-0.5">Step {step + 1} of {STEPS.length} — <span className="text-indigo-500 font-semibold">{STEPS[step].label}</span></p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MiniRing filled={filledCount} total={8} />
              <div className="text-right hidden sm:block">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Fields</p>
                <p className="text-xs font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{filledCount} / 8</p>
              </div>
            </div>
          </div>
          <StepProgress current={step} steps={STEPS} />
        </div>

        {/* Separator */}
        <div className="mx-8 h-px bg-gradient-to-r from-transparent via-indigo-200/60 to-transparent" />

        {/* ─── Step Content ─── */}
        <div className="relative px-8 py-8">
          <div ref={contentRef} key={step} className={`${direction > 0 ? 'animate-slide-in-right' : 'animate-slide-in-left'}`}>

            {/* ═══ STEP 0: Source ═══ */}
            {step === 0 && (
              <div className="space-y-6">
                {/* DOI Resolver */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 shadow-2xl shadow-indigo-500/25">
                  <div className="absolute w-44 h-44 rounded-full bg-purple-400/20 filter blur-3xl -top-10 -right-10 animate-blob" />
                  <div className="absolute w-36 h-36 rounded-full bg-blue-400/20 filter blur-3xl bottom-0 left-10 animate-blob" style={{ animationDelay: '-3s' }} />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_60%,rgba(255,255,255,0.06),transparent_50%)]" />

                  <div className="relative z-10 p-7">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="p-3 bg-white/15 backdrop-blur-sm rounded-2xl shadow-lg border border-white/10">
                        <Zap className="h-6 w-6 text-yellow-300 drop-shadow" />
                      </div>
                      <div>
                        <h2 className="text-lg font-black text-white tracking-tight">Quick Add via DOI</h2>
                        <p className="text-sm text-white/50">Paste a DOI to auto-fill everything</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="relative group">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40 group-focus-within:text-white/80 transition-colors z-10" />
                        <input
                          type="text"
                          value={doiInput}
                          onChange={(e) => { setDoiInput(e.target.value); setResolved(false); setResolveError(''); }}
                          placeholder="e.g. 10.48550/arXiv.2005.11401"
                          className="w-full pl-12 pr-4 py-4 bg-transparent border border-white/20 rounded-2xl text-white text-sm placeholder-white/30 outline-none focus:border-white/40 focus:ring-2 focus:ring-white/10 transition-all"
                          style={{ backgroundColor: 'transparent' }}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleResolve())}
                        />
                      </div>
                      <button
                        onClick={handleResolve}
                        disabled={!doiInput.trim() || resolving}
                        className="w-full flex items-center justify-center gap-2.5 px-7 py-3.5 bg-white/95 backdrop-blur-sm text-indigo-700 font-extrabold rounded-2xl hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-lg shadow-black/5 hover:shadow-xl hover:-translate-y-0.5 group"
                      >
                        {resolving ? <Loader2 className="h-5 w-5 animate-spin" /> : resolved ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Search className="h-5 w-5 group-hover:scale-110 transition-transform" />}
                        <span>{resolving ? 'Resolving...' : resolved ? 'Done!' : 'Resolve DOI'}</span>
                      </button>
                    </div>

                    {resolved && (
                      <div className="mt-4 flex items-center gap-2 px-4 py-3 bg-emerald-500/20 backdrop-blur-sm rounded-xl border border-emerald-400/20 text-sm text-emerald-200 font-medium animate-slide-up">
                        <CheckCircle2 className="h-4 w-4 text-emerald-300 flex-shrink-0" />
                        Metadata auto-filled! Moving to details...
                      </div>
                    )}
                    {resolveError && (
                      <div className="mt-4 flex items-center gap-2 px-4 py-3 bg-red-500/20 backdrop-blur-sm rounded-xl border border-red-400/20 text-sm text-red-200 font-medium animate-slide-up">
                        <AlertCircle className="h-4 w-4 text-red-300 flex-shrink-0" />
                        {resolveError}
                      </div>
                    )}
                  </div>
                </div>

                {/* OR divider */}
                <div className="flex items-center gap-5 py-1">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300/50 to-transparent" />
                  <div className="flex items-center gap-2 px-4 py-1.5 bg-gray-50 rounded-full border border-gray-100">
                    <div className="w-1 h-1 rounded-full bg-gray-300" />
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">or</span>
                    <div className="w-1 h-1 rounded-full bg-gray-300" />
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300/50 to-transparent" />
                </div>

                {/* Manual entry */}
                <button
                  onClick={goNext}
                  className="w-full group relative overflow-hidden p-6 bg-white/70 border-2 border-gray-100 rounded-2xl text-left hover:border-indigo-300 hover:bg-white hover:shadow-xl hover:shadow-indigo-500/8 transition-all cursor-pointer active:scale-[0.99]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/0 via-purple-50/0 to-pink-50/0 group-hover:from-indigo-50/40 group-hover:via-purple-50/30 group-hover:to-pink-50/20 transition-all duration-500" />
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3.5 bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl group-hover:from-indigo-100 group-hover:to-purple-50 group-hover:scale-110 group-hover:shadow-md group-hover:shadow-indigo-200/30 transition-all duration-300">
                        <FileText className="h-5 w-5 text-gray-400 group-hover:text-indigo-600 transition-colors duration-300" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800 group-hover:text-indigo-700 transition-colors">Enter Details Manually</h3>
                        <p className="text-sm text-gray-400 mt-0.5 group-hover:text-gray-500 transition-colors">Fill in paper metadata yourself</p>
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-gray-50 group-hover:bg-indigo-100 transition-all">
                      <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                </button>
              </div>
            )}

            {/* ═══ STEP 1: Details ═══ */}
            {step === 1 && (
              <div className="space-y-7">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-md shadow-indigo-500/20">
                      <Book className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-gray-900">Paper Details</h2>
                      <p className="text-xs text-gray-400">Fill in the metadata for your paper</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {resolved && (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl text-xs font-bold animate-scale-in">
                        <Zap className="h-3.5 w-3.5" /> Auto-filled
                      </span>
                    )}
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl text-[10px] font-bold">
                      {filledFields}/7 fields
                    </span>
                  </div>
                </div>

                <div className="h-px bg-gradient-to-r from-indigo-200/60 via-purple-200/40 to-transparent" />

                {/* Primary */}
                <div className="animate-slide-up" style={{ animationDelay: '0.05s', animationFillMode: 'both' }}>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    Primary Information
                  </p>
                  <FloatingInput label="Title" icon={Book} required value={form.title} onChange={set('title')} placeholder="Enter the full paper title" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-5 animate-slide-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
                  <FloatingInput className="md:col-span-3" label="Authors" icon={Users} value={form.authors} onChange={set('authors')} placeholder="Author names, comma separated" />
                  <FloatingInput className="md:col-span-2" label="Publication Year" icon={Calendar} value={form.publication_year} onChange={set('publication_year')} type="number" placeholder="2024" min="1900" max="2099" />
                </div>

                {/* Publication */}
                <div className="animate-slide-up" style={{ animationDelay: '0.15s', animationFillMode: 'both' }}>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    Publication Details
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FloatingInput label="Journal / Conference" icon={Book} value={form.journal} onChange={set('journal')} placeholder="Journal or conference name" />
                    <FloatingInput label="DOI" icon={Globe} value={form.doi} onChange={set('doi')} placeholder="10.xxxx/xxxxx" />
                  </div>
                </div>

                {/* Content */}
                <div className="animate-slide-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                    Content
                  </p>
                  <FloatingInput label="Abstract" value={form.abstract} onChange={set('abstract')} rows={5} placeholder="Paste the abstract here..." />
                  {form.abstract && (
                    <p className="text-right text-[10px] text-gray-400 mt-1.5 font-medium">
                      {form.abstract.trim().split(/\s+/).filter(Boolean).length} words
                    </p>
                  )}
                </div>

                {/* Keywords */}
                <div className="animate-slide-up" style={{ animationDelay: '0.25s', animationFillMode: 'both' }}>
                  <FloatingInput label="Keywords" icon={Tag} value={form.keywords} onChange={set('keywords')} placeholder="Comma-separated keywords" />
                  {form.keywords && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {form.keywords.split(',').map((k) => k.trim()).filter(Boolean).map((kw, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-600 rounded-lg text-[11px] font-semibold border border-indigo-100/60 animate-scale-in">
                          <Tag className="h-2.5 w-2.5" />{kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ═══ STEP 2: Upload & Status ═══ */}
            {step === 2 && (
              <div className="space-y-7">
                {/* PDF Upload */}
                <div>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-2.5 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-md shadow-violet-500/20">
                      <Paperclip className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-gray-900">PDF Upload</h2>
                      <p className="text-xs text-gray-400">Attach the paper PDF <span className="text-gray-300">(optional, up to 50MB)</span></p>
                    </div>
                  </div>

                  {file ? (
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-2 border-indigo-200 animate-scale-in">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_50%,rgba(99,102,241,0.06),transparent_60%)]" />
                      <div className="relative p-5">
                        <div className="flex items-center gap-4">
                          <div className="p-3.5 bg-white rounded-xl shadow-md shadow-indigo-200/40">
                            <FileText className="h-7 w-7 text-indigo-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-800 truncate">{file.name}</p>
                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                              <span className="flex items-center gap-1"><Hash className="h-3 w-3" />{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                              <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                                <CheckCircle2 className="h-3 w-3" /> Ready
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => setFile(null)}
                            className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all hover:scale-110"
                            data-tooltip="Remove"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                        <div className="mt-4 h-1.5 bg-indigo-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full animate-progress" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      {...getRootProps()}
                      className={`
                        relative overflow-hidden border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all group
                        ${isDragActive
                          ? 'border-indigo-500 bg-indigo-50/50 scale-[1.02] shadow-lg shadow-indigo-500/10'
                          : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/10 hover:shadow-md'}
                      `}
                    >
                      <input {...getInputProps()} />
                      <div className={`absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.04),transparent_70%)] transition-opacity ${isDragActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                      <div className="relative">
                        <div className={`inline-flex p-5 rounded-2xl mb-4 transition-all ${isDragActive ? 'bg-indigo-100 scale-110' : 'bg-gray-50 group-hover:bg-indigo-50'}`}>
                          <Upload className={`h-10 w-10 transition-all ${isDragActive ? 'text-indigo-500 animate-bounce' : 'text-gray-300 group-hover:text-indigo-400'}`} />
                        </div>
                        <p className="text-sm font-bold text-gray-700 mb-1">
                          {isDragActive ? 'Drop it here!' : 'Drag & drop a PDF here'}
                        </p>
                        <p className="text-xs text-gray-400 mb-4">or click to browse your files</p>
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-500">
                          <Shield className="h-3 w-3" />
                          <span>PDF up to 50MB • Secure upload</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Separator */}
                <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

                {/* Reading Status */}
                <div>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-md shadow-emerald-500/20">
                      <Eye className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-gray-900">Reading Status</h2>
                      <p className="text-xs text-gray-400">Set your current reading progress</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {STATUSES.map((s) => {
                      const isActive = form.reading_status === s.value;
                      return (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, reading_status: s.value }))}
                          className={`
                            relative overflow-hidden p-5 rounded-2xl text-left transition-all duration-300
                            ${isActive
                              ? `bg-gradient-to-br ${s.color} text-white shadow-xl scale-[1.03]`
                              : 'bg-white border-2 border-gray-100 hover:border-indigo-200 hover:shadow-md hover:scale-[1.01]'}
                          `}
                        >
                          {isActive && <div className="absolute inset-0 bg-white/5" />}
                          <div className="relative">
                            <span className="text-3xl mb-3 block">{s.icon}</span>
                            <p className={`font-bold text-sm ${isActive ? 'text-white' : 'text-gray-800'}`}>{s.label}</p>
                            <p className={`text-[11px] mt-1 leading-relaxed ${isActive ? 'text-white/70' : 'text-gray-400'}`}>{s.desc}</p>
                          </div>
                          {isActive && (
                            <div className="absolute top-3 right-3 p-1.5 bg-white/20 rounded-lg animate-scale-in">
                              <Check className="h-3.5 w-3.5 text-white" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ═══ STEP 3: Review ═══ */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-md shadow-emerald-500/20">
                      <Eye className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-gray-900">Review & Save</h2>
                      <p className="text-xs text-gray-400">Confirm everything looks good</p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl text-[10px] font-bold">
                    <CheckCircle2 className="h-3 w-3" />
                    {filledCount} fields filled
                  </span>
                </div>

                <div className="h-px bg-gradient-to-r from-emerald-200/60 via-teal-200/40 to-transparent" />

                {/* Summary rows */}
                <div className="space-y-1">
                  {[
                    { label: 'Title', value: form.title, required: true, icon: Book },
                    { label: 'Authors', value: form.authors, icon: Users },
                    { label: 'Year', value: form.publication_year, icon: Calendar },
                    { label: 'Journal', value: form.journal, icon: Book },
                    { label: 'DOI', value: form.doi, icon: Globe },
                    { label: 'Keywords', value: form.keywords, icon: Tag },
                    { label: 'Status', value: STATUSES.find((s) => s.value === form.reading_status)?.label, icon: Eye },
                    { label: 'PDF', value: file?.name, icon: FileText },
                  ].map((row, i) => {
                    const RowIcon = row.icon;
                    return (
                      <div
                        key={row.label}
                        className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-gray-50/70 transition-all animate-slide-up group"
                        style={{ animationDelay: `${i * 0.04}s`, animationFillMode: 'both' }}
                      >
                        <div className={`p-2 rounded-lg transition-colors ${row.value ? 'bg-indigo-50 text-indigo-500' : 'bg-gray-50 text-gray-300'}`}>
                          <RowIcon className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider w-16 flex-shrink-0">
                          {row.label}
                          {row.required && !row.value && <span className="text-red-400 ml-0.5">*</span>}
                        </span>
                        <span className={`text-sm flex-1 truncate ${row.value ? 'text-gray-800 font-medium' : 'text-gray-300 italic'}`}>
                          {row.value || 'Not provided'}
                        </span>
                        {row.value && <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />}
                      </div>
                    );
                  })}
                </div>

                {/* Abstract preview */}
                {form.abstract && (
                  <div className="p-5 bg-gradient-to-r from-gray-50 to-indigo-50/30 rounded-xl border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      Abstract Preview
                    </p>
                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{form.abstract}</p>
                    <p className="text-[10px] text-gray-400 mt-2 font-medium">
                      {form.abstract.trim().split(/\s+/).filter(Boolean).length} words
                    </p>
                  </div>
                )}

                {/* Keywords preview */}
                {form.keywords && (
                  <div className="flex flex-wrap gap-1.5">
                    {form.keywords.split(',').map((k) => k.trim()).filter(Boolean).map((kw, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-600 rounded-lg text-[11px] font-semibold border border-indigo-100/60">
                        <Tag className="h-2.5 w-2.5" />{kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* ─── Navigation Footer ─── */}
        <div className="relative z-20">
          <div className="mx-6 h-px bg-gradient-to-r from-transparent via-gray-200/60 to-transparent" />
          <div className="px-8 py-6 pb-8">
            <div className="flex items-center justify-between">
              {step > 0 ? (
                <button
                  onClick={goBack}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-xl hover:bg-white hover:border-gray-300 hover:shadow-sm active:scale-95 transition-all group"
                >
                  <ChevronLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                  Back
                </button>
              ) : (
                <button
                  onClick={() => navigate('/')}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-xl hover:bg-white hover:border-gray-300 hover:shadow-sm active:scale-95 transition-all"
                >
                  <RotateCcw className="h-4 w-4" />
                  Cancel
                </button>
              )}

              <div className="flex items-center gap-3">
                <span className="hidden sm:flex items-center gap-1 text-[10px] text-gray-400 font-medium">
                  <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono">Ctrl</kbd>
                  <span>+</span>
                  <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono">Enter</kbd>
                </span>

                {step < 3 ? (
                  <button
                    onClick={goNext}
                    className="flex items-center gap-2 px-7 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-extrabold rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 active:scale-95 transition-all group"
                  >
                    Continue
                    <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ) : (
                  <button
                    data-submit
                    onClick={handleSubmit}
                    disabled={!form.title.trim() || submitting}
                    className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-extrabold rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all group"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 group-hover:scale-110 transition-transform" />}
                    {submitting ? 'Saving...' : 'Save Paper'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
