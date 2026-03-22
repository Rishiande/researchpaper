import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ message = 'Loading...', fullPage = false }) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      {/* Animated rings */}
      <div className="relative">
        <div className="h-12 w-12 rounded-full border-4 border-indigo-100 animate-pulse" />
        <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-transparent border-t-indigo-600 animate-spin" />
        <div className="absolute inset-1 h-10 w-10 rounded-full border-4 border-transparent border-b-purple-500 animate-spin-slow" style={{ animationDirection: 'reverse' }} />
      </div>
      <div className="text-center">
        <p className="text-sm text-gray-600 font-semibold animate-pulse">{message}</p>
        <div className="flex items-center justify-center gap-1 mt-2">
          <span className="h-1 w-1 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0s' }} />
          <span className="h-1 w-1 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0.15s' }} />
          <span className="h-1 w-1 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0.3s' }} />
        </div>
      </div>
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center animate-fade-in">
        {content}
      </div>
    );
  }

  return content;
}

export function SkeletonCard() {
  return (
    <div className="bg-white/80 glass rounded-2xl p-5 space-y-3 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-5 w-16 rounded-full" />
      </div>
      <div className="skeleton h-3 w-1/2" />
      <div className="flex gap-2">
        <div className="skeleton h-5 w-12 rounded-md" />
        <div className="skeleton h-5 w-10 rounded-md" />
      </div>
      <div className="flex gap-1.5">
        <div className="skeleton h-5 w-20 rounded-lg" />
        <div className="skeleton h-5 w-16 rounded-lg" />
      </div>
      <div className="pt-3 border-t border-gray-100 flex justify-between">
        <div className="skeleton h-3 w-20" />
        <div className="skeleton h-4 w-4 rounded" />
      </div>
    </div>
  );
}
