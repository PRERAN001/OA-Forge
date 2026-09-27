'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
    window.addEventListener('aura_credits_updated', update);
    return () => {
      window.removeEventListener('storage', update);
      window.removeEventListener('aura_credits_updated', update);
    };
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
    <header className="sticky top-0 z-40 w-full border-b border-[#383838] bg-[#1a1a1a]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 transition opacity-90 hover:opacity-100">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ffa116] font-bold text-[#1a1a1a] shadow-sm">
            <Zap className="h-4 w-4 text-[#1a1a1a]" fill="currentColor" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight text-white">
              Code<span className="text-[#ffa116] font-semibold">Sprint</span>
            </span>
            <span className="rounded bg-[#282828] px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 uppercase tracking-wider border border-[#383838] hidden sm:inline-block">
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
                    ? 'bg-[#282828] text-[#ffa116] border border-[#383838] font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#282828]'
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
            className="flex items-center gap-1.5 rounded-lg bg-[#282828] border border-[#383838] px-2.5 py-1 text-xs font-mono text-zinc-300 hover:border-[#ffa116]/50 transition"
            title="Manage OA Credits"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#ffa116]" />
            <span className="text-[11px]">
              {isUnlimited ? 'Unlimited' : `${credits !== null ? credits : 3} Credit(s)`}
            </span>
          </Link>

          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-lg bg-[#ffa116] px-3.5 py-1.5 text-xs font-semibold text-[#1a1a1a] transition hover:bg-[#ffa116]/90 border border-[#ffa116]/40"
          >
            <Plus className="h-4 w-4" />
            New OA
          </Link>

          {/* User Profile / Auth State */}
          {status === 'authenticated' && session?.user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-[#383838]">
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                  className="h-7 w-7 rounded-full border border-[#ffa116]/40 object-cover"
                />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#282828] border border-[#383838] text-xs font-bold text-[#ffa116]">
                  {session.user.name?.[0] || 'U'}
                </div>
              )}
              <button
                onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-[#282828] transition"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn('google')}
              className="flex items-center gap-1.5 rounded-lg border border-[#383838] bg-[#282828] px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-[#383838] transition"
            >
              <User className="h-3.5 w-3.5" />
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
