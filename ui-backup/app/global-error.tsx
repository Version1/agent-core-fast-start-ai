'use client';

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', backgroundColor: '#f9fafb' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1.5rem' }}>
          <div style={{ background: '#fff', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '2rem', maxWidth: '28rem', width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠</div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1a1a1a', marginBottom: '0.5rem' }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
              An unexpected error occurred. Please try again.
            </p>
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '1.5rem', wordBreak: 'break-word' }}>
              {error.message}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={() => window.location.reload()}
                style={{ padding: '0.5rem 1rem', backgroundColor: '#003A46', color: '#fff', border: 'none', borderRadius: '0.375rem', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}
              >
                Try again
              </button>
              <button
                onClick={() => {
                  try { localStorage.clear(); } catch {}
                  window.location.href = '/login';
                }}
                style={{ padding: '0.5rem 1rem', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '0.375rem', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
