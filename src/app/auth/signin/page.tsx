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
    <div className="flex min-h-screen w-full items-center justify-center bg-[#1a1a1a] px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-[#383838] bg-[#282828] p-8 space-y-8 shadow-2xl text-center">
        {/* Brand Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#ffa116] font-bold text-[#1a1a1a] shadow-lg shadow-[#ffa116]/10">
            <Zap className="h-6 w-6 text-[#1a1a1a]" fill="currentColor" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Sign in to Code<span className="text-[#ffa116]">Sprint</span>
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
            className="w-full flex items-center justify-center gap-3 rounded-xl border border-[#383838] bg-[#1e1e1e] px-4 py-3 text-xs font-bold text-white hover:bg-[#383838] transition shadow-md disabled:opacity-50"
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
            {isLoading ? 'Signing in with Google...' : 'Continue with Google Account'}
          </button>
        </div>

        {/* Security Footer */}
        <div className="pt-2 border-t border-[#383838] flex items-center justify-center gap-1.5 text-[11px] font-mono text-zinc-500">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span>OAuth 2.0 SSL Encrypted Authentication</span>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-[#1a1a1a] text-zinc-400 font-mono text-xs">
          Loading authentication...
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
