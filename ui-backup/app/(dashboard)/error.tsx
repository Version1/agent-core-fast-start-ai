'use client';

export default function DashboardError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <div className="bg-fast-panel rounded-lg shadow-card p-8 max-w-md w-full text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-fast-red-light flex items-center justify-center text-2xl">
          ⚠
        </div>
        <h2 className="text-xl font-bold text-fast-text mb-2">Something went wrong</h2>
        <p className="text-sm text-fast-muted mb-2">
          An unexpected error occurred. Please try again or return to the dashboard.
        </p>
        <p className="text-xs text-gray-400 mb-6 break-words">
          {error.message}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-fast-teal text-white rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Try again
          </button>
          <a
            href="/dashboard"
            className="px-4 py-2 border border-gray-200 text-fast-text rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
