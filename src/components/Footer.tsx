'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Zap, ShieldCheck } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();

  const isOAActive = pathname.startsWith('/oa/') && !pathname.includes('/results/');
  if (isOAActive) return null;

  return (
    <footer className="w-full border-t border-[#383838] bg-[#1a1a1a] py-10 text-xs text-zinc-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-[#ffa116] font-bold text-[#1a1a1a]">
                <Zap className="h-3.5 w-3.5 text-[#1a1a1a]" fill="currentColor" />
              </div>
              <span className="font-bold text-white text-sm">
                Code<span className="text-[#ffa116]">Sprint</span>
              </span>
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Custom Online Assessment builder powered by authentic algorithm problem dataset (2,800+ questions).
            </p>
          </div>

          {/* Col 2: Platform Links */}
          <div className="space-y-2 font-mono">
            <span className="font-bold text-white text-xs uppercase tracking-wider block mb-2">
              Platform Features
            </span>
            <ul className="space-y-1.5">
              <li>
                <Link href="/" className="hover:text-[#ffa116] transition">
                  OA Customizer Builder
                </Link>
              </li>
              <li>
                <Link href="/questions" className="hover:text-[#ffa116] transition">
                  Question Bank Explorer
                </Link>
              </li>
              <li>
                <Link href="/contribute" className="hover:text-[#ffa116] transition">
                  Contribute Questions (+1 Free OA)
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-[#ffa116] transition">
                  Pricing & Razorpay Passes
                </Link>
              </li>
              <li>
                <Link href="/history" className="hover:text-[#ffa116] transition">
                  Assessment History
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Legal & Merchant Trust Pages */}
          <div className="space-y-2 font-mono">
            <span className="font-bold text-white text-xs uppercase tracking-wider block mb-2">
              Razorpay Compliance Pages
            </span>
            <ul className="space-y-1.5">
              <li>
                <Link href="/privacy" className="hover:text-[#ffa116] transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[#ffa116] transition">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="hover:text-[#ffa116] transition">
                  Cancellation & Refund Policy
                </Link>
              </li>
              <li>
                <Link href="/shipping-policy" className="hover:text-[#ffa116] transition">
                  Shipping & Delivery Policy
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#ffa116] transition">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-[#ffa116] transition">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Razorpay Security Info */}
          <div className="space-y-3 font-mono">
            <span className="font-bold text-white text-xs uppercase tracking-wider block">
              Payment Gateway Security
            </span>
            <div className="rounded-lg border border-[#383838] bg-[#282828] p-3 space-y-1 text-[11px] text-zinc-400">
              <span className="text-[#ffa116] font-semibold flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                Razorpay Verified Gateway
              </span>
              <p>256-bit encryption. Supports Credit/Debit Cards, UPI, NetBanking & Wallets.</p>
            </div>
          </div>
        </div>

        <div className="border-t border-[#383838] pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-500 font-mono gap-3">
          <span>© {new Date().getFullYear()} CodeSprint. All rights reserved.</span>
          <span>Razorpay Merchant Onboarding Ready</span>
        </div>
      </div>
    </footer>
  );
}
