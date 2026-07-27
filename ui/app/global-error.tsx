'use client';

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif", backgroundColor: '#f4f6f8' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1.5rem' }}>
          <div style={{ background: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0', padding: '2.5rem', maxWidth: '28rem', width: '100%', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', margin: '0 auto 1rem', borderRadius: '50%', backgroundColor: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f44336" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
            </div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1a2332', marginBottom: '0.5rem' }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>
              An unexpected error occurred. Please try again.
            </p>
            <p style={{ fontSize: '0.75rem', color: '#8896a6', marginBottom: '1.5rem', wordBreak: 'break-word' }}>
              {error.message}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={() => window.location.reload()}
                style={{ padding: '0.5rem 1rem', backgroundColor: '#003A46', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}
              >
                Try again
              </button>
              <button
                onClick={() => {
                  try { localStorage.clear(); } catch {}
                  window.location.href = '/login';
                }}
                style={{ padding: '0.5rem 1rem', backgroundColor: '#f44336', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}
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
