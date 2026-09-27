'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
<<<<<<< HEAD
import { getUserCredits } from '@/lib/userCredits';
import { Zap, BookOpen, Trophy, Plus, FilePlus, CreditCard, Sparkles } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
=======
import { useSession, signOut, signIn } from 'next-auth/react';
import { getUserCredits } from '@/lib/userCredits';
import {
  Zap,
  BookOpen,
  Trophy,
  Plus,
  FilePlus,
  CreditCard,
  Sparkles,
  LogOut,
  User,
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

>>>>>>> 79805f92759fd023359b1532fe04888b298eff90
  const [credits, setCredits] = useState<number | null>(null);
  const [isUnlimited, setIsUnlimited] = useState(false);

  useEffect(() => {
    const update = () => {
      const uState = getUserCredits();
      setCredits(uState.credits);
      setIsUnlimited(uState.isUnlimited);
    };
    update();
    window.addEventListener('storage', update);
    return () => window.removeEventListener('storage', update);
  }, [pathname]);

  const isOAActive = pathname.startsWith('/oa/') && !pathname.includes('/results/');

  if (isOAActive) {
    return null;
  }

  const links = [
    { href: '/', label: 'OA Builder', icon: Zap },
    { href: '/questions', label: 'Question Bank', icon: BookOpen },
    { href: '/contribute', label: 'Contribute (+1 OA)', icon: FilePlus },
    { href: '/pricing', label: 'Pricing & Passes', icon: CreditCard },
    { href: '/history', label: 'History', icon: Trophy },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 transition opacity-90 hover:opacity-100">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 font-bold text-zinc-950 shadow-sm">
            <Zap className="h-4 w-4 text-zinc-950" fill="currentColor" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight text-white">
              Aura <span className="text-amber-400 font-semibold">OA</span>
            </span>
            <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 uppercase tracking-wider border border-zinc-700/60 hidden sm:inline-block">
              Question Bank Engine
            </span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? 'bg-zinc-800 text-amber-400 border border-zinc-700/60 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          {/* Credits Display */}
          <Link
            href="/pricing"
            className="flex items-center gap-1.5 rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 py-1 text-xs font-mono text-zinc-300 hover:border-amber-500/50 transition"
            title="Manage OA Credits"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-[11px]">
              {isUnlimited ? 'Unlimited' : `${credits !== null ? credits : 1} Credit(s)`}
            </span>
          </Link>

          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-1.5 text-xs font-semibold text-zinc-950 transition hover:bg-amber-400 border border-amber-400/40"
          >
            <Plus className="h-4 w-4" />
            New OA
          </Link>
<<<<<<< HEAD
=======

          {/* User Profile / Auth State */}
          {status === 'authenticated' && session.user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-zinc-800">
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                  className="h-7 w-7 rounded-full border border-amber-500/40 object-cover"
                />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700 text-xs font-bold text-amber-400">
                  {session.user.name?.[0] || 'U'}
                </div>
              )}
              <button
                onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-zinc-900 transition"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn('google')}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 transition"
            >
              <User className="h-3.5 w-3.5" />
              Sign In
            </button>
          )}
>>>>>>> 79805f92759fd023359b1532fe04888b298eff90
        </div>
      </div>
    </header>
  );
}
