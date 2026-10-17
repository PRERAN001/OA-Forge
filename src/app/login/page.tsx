'use client';

import { Suspense, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginContent() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace(callbackUrl);
    } else if (status === 'unauthenticated') {
      signIn('google', { callbackUrl });
    }
  }, [status, callbackUrl, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-[#1a1a1a] text-zinc-400 font-mono text-xs">
      Connecting to RoundZero authentication...
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-[#1a1a1a] text-zinc-400 font-mono text-xs">
          Loading RoundZero...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
