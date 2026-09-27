'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getUserCredits } from '@/lib/userCredits';
<<<<<<< HEAD
=======
import RazorpayPayButton from '@/components/RazorpayPayButton';
>>>>>>> 79805f92759fd023359b1532fe04888b298eff90
import {
  Zap,
  Check,
  ShieldCheck,
  ArrowRight,
  FilePlus,
  CreditCard,
  Lock,
  Sparkles,
  Calendar,
} from 'lucide-react';

export default function PricingPage() {
  const router = useRouter();
  const [credits, setCredits] = useState(1);
  const [isUnlimited, setIsUnlimited] = useState(false);

  useEffect(() => {
    const userState = getUserCredits();
    setCredits(userState.credits);
    setIsUnlimited(userState.isUnlimited);
  }, []);

  const plan = {
    id: 'unlimited_3months_99',
    name: '3 Months Unlimited Pro Pass',
<<<<<<< HEAD
    price: 99,
=======
    price: 1,
>>>>>>> 79805f92759fd023359b1532fe04888b298eff90
    credits: 999,
    unlimited: true,
    duration: '3 Months Unlimited Access',
    description: 'Complete technical assessment platform access for 3 full months.',
    features: [
      'Unlimited OA Generations for 3 Months',
      'Access 2,800+ Algorithm Problem Dataset',
      'Custom Difficulty Levels & Topic Filters',
      'Monaco Code Editor & Sample Test Execution',
      'Custom Score Multipliers & Detailed Performance Reports',
      'Instant Razorpay Payment Activation',
    ],
  };

  const handleSelectPlan = () => {
    router.push(
      `/checkout?planId=${plan.id}&amount=${plan.price}&credits=${plan.credits}&name=${encodeURIComponent(
        plan.name
      )}`
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3 max-w-xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs font-mono text-zinc-300">
          <CreditCard className="h-3.5 w-3.5 text-amber-400" />
          Razorpay Payment Pass
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          3 Months Unlimited Access
        </h1>
        <p className="text-zinc-400 text-xs sm:text-sm">
          Get 3 full months of unlimited online assessment generations for just ₹99 via Razorpay!
        </p>

        <div className="pt-1">
          <span className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-1 text-xs font-mono text-zinc-300">
            Current Status: <strong className="text-amber-400">{isUnlimited ? '3 Months Unlimited Active' : `${credits} Credit(s)`}</strong>
          </span>
        </div>
      </div>

      {/* Free Alternative Banner */}
      <div className="rounded-xl border border-amber-500/40 bg-zinc-900/90 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <FilePlus className="h-4 w-4" />
            Free Alternative — No Payment Required!
          </span>
          <p className="text-xs text-zinc-300">
            Don&apos;t want to pay ₹99? Submit 3 unique algorithm questions (with description, test cases & edge cases) to earn free passes!
          </p>
        </div>

        <Link
          href="/contribute"
          className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-bold text-amber-400 whitespace-nowrap"
        >
          Contribute Questions (+1 Free OA)
        </Link>
      </div>

      {/* Single Pricing Card (₹99 for 3 Months) */}
      <div className="max-w-xl mx-auto rounded-2xl border-2 border-amber-500 bg-zinc-950 p-8 space-y-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-amber-500 text-zinc-950 text-[10px] font-bold uppercase tracking-widest px-4 py-1 rounded-bl-lg">
          Special Unlimited Pass
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-bold uppercase">
            <Calendar className="h-4 w-4" />
            3 Months Full Access
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-white">{plan.name}</h2>
            <p className="text-xs text-zinc-400 mt-1">{plan.description}</p>
          </div>

          <div className="flex items-baseline gap-2 font-mono pt-2">
            <span className="text-4xl font-extrabold text-white">
              ₹99
            </span>
            <span className="text-xs text-zinc-400">/ 3 Months Unlimited</span>
          </div>

          <div className="space-y-3 pt-6 border-t border-zinc-800">
            {plan.features.map((feat, i) => (
              <div key={i} className="flex items-center gap-2.5 text-xs text-zinc-200">
                <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>

<<<<<<< HEAD
        <button
          type="button"
          onClick={handleSelectPlan}
          className="w-full py-3.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold border border-amber-400/40 text-sm transition shadow-lg flex items-center justify-center gap-2"
        >
          <span>Get 3 Months Unlimited Pass (₹99)</span>
          <ArrowRight className="h-4 w-4" />
        </button>
=======
        <RazorpayPayButton
          planId={plan.id}
          amount={plan.price}
          credits={plan.credits}
          planName={plan.name}
          buttonText="Pay ₹99 & Unlock 3 Months Pass"
        />
>>>>>>> 79805f92759fd023359b1532fe04888b298eff90

        <div className="flex items-center justify-center gap-2 text-[11px] text-zinc-500 font-mono text-center">
          <Lock className="h-3.5 w-3.5 text-amber-400" />
          Secured by Razorpay Gateway • Instant Digital Fulfillment
        </div>
      </div>

      {/* Trust Badges */}
      <div className="flex flex-wrap items-center justify-center gap-6 pt-2 text-xs font-mono text-zinc-400 border-t border-zinc-800">
        <span className="flex items-center gap-1.5">
          <Lock className="h-4 w-4 text-amber-400" />
          Razorpay 256-Bit Encryption
        </span>
        <span>•</span>
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          Instant Activation
        </span>
      </div>
    </div>
  );
}
