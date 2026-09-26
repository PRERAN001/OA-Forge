'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { OASession } from '@/types/oa';
import { getAllSessionsLocal } from '@/lib/sessionStore';
import { Trophy, Clock, Award, ArrowRight, AlertCircle, Plus } from 'lucide-react';

export default function HistoryPage() {
  const [sessions, setSessions] = useState<OASession[]>([]);

  useEffect(() => {
    const list = getAllSessionsLocal();
    setSessions(list);
  }, []);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 sm:p-8 space-y-2">
        <div className="inline-flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs font-mono text-zinc-300">
          <Trophy className="h-3.5 w-3.5 text-amber-400" />
          Performance Records
        </div>
        <h1 className="text-2xl font-bold text-white">
          Past Assessment History
        </h1>
        <p className="text-zinc-400 text-xs max-w-2xl">
          Review your previous mock assessments, total score achievements, and detailed problem submissions.
        </p>
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-12 text-center space-y-4">
          <AlertCircle className="h-10 w-10 text-zinc-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Past Assessments Found</h3>
          <p className="text-zinc-400 text-xs max-w-md mx-auto">
            You haven&apos;t taken any Online Assessments yet. Customize your first OA test now!
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 border border-amber-400/40 px-4 py-2 font-bold text-zinc-950 text-xs hover:bg-amber-400 transition"
          >
            <Plus className="h-4 w-4" />
            Create Your First OA
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((sess) => {
            const scorePct = Math.round((sess.totalScore / (sess.maxScore || 1)) * 100);
            return (
              <div
                key={sess.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-950 gap-4 hover:border-zinc-700 transition"
              >
                <div className="space-y-1">
                  <h3 className="font-bold text-white text-sm">{sess.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-zinc-400 font-mono">
                    <span>
                      Date: {new Date(sess.createdAt).toLocaleDateString()}
                    </span>
                    <span>•</span>
                    <span>{sess.questions.length} Questions</span>
                    <span>•</span>
                    <span>{sess.timeLimitMinutes} Mins</span>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right font-mono">
                    <span className="text-[11px] text-zinc-400 block">Achieved Score</span>
                    <span className="text-sm font-bold text-amber-400">
                      {sess.totalScore} / {sess.maxScore} pts ({scorePct}%)
                    </span>
                  </div>

                  <Link
                    href={`/oa/results/${sess.id}`}
                    className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-1.5 text-xs font-semibold text-zinc-200 hover:text-white hover:bg-zinc-800 transition"
                  >
                    View Report
                    <ArrowRight className="h-3.5 w-3.5 text-amber-400" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
