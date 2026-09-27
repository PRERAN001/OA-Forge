import Link from 'next/link';
import { Zap, BookOpen, Award, ShieldCheck, ArrowRight } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-10 space-y-8 text-zinc-300">
      <div className="border-b border-[#383838] pb-4 space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">About CodeSprint</h1>
        <p className="text-xs text-zinc-400">
          The ultimate technical online assessment mock platform powered by authentic algorithm problem dataset.
        </p>
      </div>

      <div className="space-y-6 text-xs sm:text-sm leading-relaxed font-sans">
        <section className="space-y-3">
          <h2 className="text-base font-bold text-white">Our Mission</h2>
          <p>
            CodeSprint was built to give software engineers, university students, and job seekers an authentic, distraction-free environment to prepare for top-tier company online assessments (OAs).
          </p>
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="rounded-xl border border-[#383838] bg-[#282828] p-4 space-y-2">
            <BookOpen className="h-5 w-5 text-[#ffa116]" />
            <h3 className="font-bold text-white text-xs">2,800+ Real Problems</h3>
            <p className="text-zinc-400 text-[11px]">
              Directly powered by 2,800+ authentic algorithm questions with complete descriptions & test cases.
            </p>
          </div>

          <div className="rounded-xl border border-[#383838] bg-[#282828] p-4 space-y-2">
            <Zap className="h-5 w-5 text-[#ffa116]" />
            <h3 className="font-bold text-white text-xs">Custom Difficulty & Points</h3>
            <p className="text-zinc-400 text-[11px]">
              Set custom point allocations, duration limits, and topic tags per assessment.
            </p>
          </div>

          <div className="rounded-xl border border-[#383838] bg-[#282828] p-4 space-y-2">
            <Award className="h-5 w-5 text-[#ffa116]" />
            <h3 className="font-bold text-white text-xs">Fair Access & Rewards</h3>
            <p className="text-zinc-400 text-[11px]">
              Get 1 free OA pass initially. Buy credit passes via Razorpay or contribute 3 questions for free passes!
            </p>
          </div>
        </div>

        <div className="pt-4 flex items-center justify-center gap-4">
          <Link
            href="/"
            className="px-5 py-2.5 rounded-lg bg-[#ffa116] hover:bg-[#ffa116]/90 text-[#1a1a1a] font-bold text-xs border border-[#ffa116]/40 transition flex items-center gap-1.5"
          >
            Build Assessment
            <ArrowRight className="h-4 w-4 text-[#1a1a1a]" />
          </Link>
          <Link
            href="/contribute"
            className="px-5 py-2.5 rounded-lg border border-[#383838] bg-[#282828] text-zinc-200 hover:text-white font-semibold text-xs"
          >
            Contribute Questions
          </Link>
        </div>
      </div>
    </div>
  );
}
