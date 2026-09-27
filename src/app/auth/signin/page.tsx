'use client';

import { Suspense, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Zap, Lock, ShieldCheck } from 'lucide-react';

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = () => {
    setIsLoading(true);
    signIn('google', { callbackUrl });
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 space-y-8 shadow-2xl text-center">
        {/* Brand Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 font-bold text-zinc-950 shadow-lg shadow-amber-500/10">
            <Zap className="h-6 w-6 text-zinc-950" fill="currentColor" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Sign in to Aura <span className="text-amber-400">OA</span>
          </h1>
          <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
            Access algorithm questions, assessment generator, code execution console, and scoring tools.
          </p>
        </div>

        {/* Google Sign-In Button */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-xs font-bold text-white hover:bg-zinc-800 hover:border-zinc-600 transition shadow-md disabled:opacity-50"
          >
            {/* Google G Logo SVG */}
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.37 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.99-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z"
              />
            </svg>
            <span>{isLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
          </button>
        </div>

        {/* Security & Authentication Info */}
        <div className="pt-4 border-t border-zinc-800 text-[11px] text-zinc-500 font-mono space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-zinc-400">
            <Lock className="h-3.5 w-3.5 text-amber-400" />
            <span>OAuth 2.0 Secure Authentication</span>
          </div>
          <p>Protected by NextAuth.js and Google Identity Services.</p>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-zinc-950 text-white font-mono text-xs">
          Loading Sign In...
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
