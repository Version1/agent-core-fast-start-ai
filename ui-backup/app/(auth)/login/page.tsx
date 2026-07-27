'use client';

import { useState } from 'react';
import { buildAuthorizeUrl } from '@/lib/auth/cognito';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const handleSSO = async () => {
    setLoading(true);
    const url = await buildAuthorizeUrl();
    window.location.href = url;
  };

  return (
    <div className="min-h-screen bg-fast-bg flex flex-col">
      <header className="bg-fast-sidebar text-white p-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <img
            src="/version1-logo.svg"
            alt="Version 1"
            className="h-10 w-auto object-contain"
          />
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-fast-cyan">VERSION 1</p>
            <h1 className="text-lg font-bold">FastStartAI</h1>
            <p className="text-xs text-white/80">AI-Powered Case Review System</p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md w-full space-y-6">
          <div className="bg-fast-panel rounded-lg shadow-card p-8">
            <h2 className="text-xl font-bold text-fast-text mb-4 text-center">Sign In</h2>
            <div className="bg-fast-teal-light border border-fast-teal/30 rounded-lg p-3 mb-6">
              <p className="text-sm text-fast-teal">
                <strong>Secure Login:</strong> You will be redirected to your organisation&apos;s
                authentication page to sign in.
              </p>
            </div>
            <button
              onClick={handleSSO}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-fast-teal text-white rounded-md font-semibold hover:opacity-90 transition-colors disabled:opacity-40"
            >
              {loading ? 'Redirecting…' : 'Sign In with Single Sign-On'}
            </button>
          </div>

          <div className="text-center text-sm text-fast-muted">
            <p>Privacy Policy | Terms of Service | Support</p>
            <p className="mt-1">support@faststart.ai | (555) 123-4567</p>
          </div>
        </div>
      </main>
    </div>
  );
}
