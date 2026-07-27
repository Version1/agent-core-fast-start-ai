'use client';

import { useState } from 'react';
import { LogIn } from 'lucide-react';
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
      <header className="bg-fast-sidebar text-white px-6 py-4 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <img
            src="/version1-logo.svg"
            alt="Version 1"
            className="h-10 w-auto object-contain"
          />
          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase text-fast-cyan">VERSION 1</p>
            <h1 className="text-lg font-semibold">FastStartAI</h1>
            <p className="text-xs text-white/70">AI-Powered Case Review System</p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md w-full space-y-6">
          <div className="bg-fast-panel rounded-card border border-gray-200 p-8">
            <h2 className="text-xl font-semibold text-fast-text mb-5 text-center">Sign In</h2>
            <div className="bg-fast-teal-light border border-fast-teal/20 rounded p-3 mb-6">
              <p className="text-sm text-fast-teal">
                <strong>Secure Login:</strong> You will be redirected to your organisation&apos;s
                authentication page to sign in.
              </p>
            </div>
            <button
              onClick={handleSSO}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-fast-teal text-white rounded font-medium text-sm hover:bg-fast-teal/90 transition-colors disabled:opacity-40"
            >
              <LogIn className="w-4 h-4" />
              {loading ? 'Redirecting...' : 'Sign In with Single Sign-On'}
            </button>
          </div>

          <div className="text-center text-xs text-fast-muted space-y-1">
            <p>Privacy Policy &middot; Terms of Service &middot; Support</p>
            <p>support@faststart.ai &middot; (555) 123-4567</p>
          </div>
        </div>
      </main>
    </div>
  );
}
