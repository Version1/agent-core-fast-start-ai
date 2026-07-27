'use client';

import { AlertTriangle } from 'lucide-react';

export default function DashboardError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <div className="bg-fast-panel rounded-card border border-gray-200 p-8 max-w-md w-full text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-fast-red-light flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-fast-declined" />
        </div>
        <h2 className="text-lg font-semibold text-fast-text mb-2">Something went wrong</h2>
        <p className="text-sm text-fast-muted mb-2">
          An unexpected error occurred. Please try again or return to the dashboard.
        </p>
        <p className="text-xs text-gray-400 mb-6 break-words">
          {error.message}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-fast-teal text-white rounded text-sm font-medium hover:bg-fast-teal/90 transition-colors"
          >
            Try again
          </button>
          <a
            href="/dashboard"
            className="px-4 py-2 border border-gray-300 text-fast-text rounded text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
