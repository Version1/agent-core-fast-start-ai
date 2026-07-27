'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { exchangeCodeForTokens, parseUserFromTokens } from '@/lib/auth/cognito';
import { setAccessToken } from '@/lib/auth/session';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const code = searchParams?.get('code');
    if (!code) {
      setError('No authorization code received.');
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const tokens = await exchangeCodeForTokens(code);
        if (cancelled) return;

        setAccessToken(tokens.idToken);
        const user = parseUserFromTokens(tokens.idToken);
        login(user);
        router.replace('/dashboard');
      } catch (err: any) {
        if (cancelled) return;
        setError(err.message || 'Authentication failed.');
      }
    })();

    return () => { cancelled = true; };
  }, [searchParams, login, router]);

  if (error) {
    return (
      <div className="min-h-screen bg-fast-bg flex items-center justify-center p-8">
        <div className="bg-fast-panel rounded-lg shadow-card p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-fast-red-light rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-fast-declined text-3xl">!</span>
          </div>
          <h2 className="text-xl font-bold text-fast-text mb-2">Sign In Failed</h2>
          <p className="text-sm text-fast-muted mb-4">{error}</p>
          <button
            onClick={() => router.replace('/login')}
            className="px-6 py-2 bg-fast-teal text-white rounded-md font-semibold hover:opacity-90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fast-bg flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-fast-teal border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-fast-muted">Completing sign in…</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-fast-bg flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-fast-teal border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-fast-muted">Completing sign in…</p>
          </div>
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
