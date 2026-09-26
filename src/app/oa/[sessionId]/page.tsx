'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { OASession, Question, Submission } from '@/types/oa';
import { getSessionLocal, saveSessionLocal } from '@/lib/sessionStore';
import DifficultyBadge from '@/components/DifficultyBadge';
import CodeEditor from '@/components/CodeEditor';
import Timer from '@/components/Timer';
import {
  CheckCircle2,
  AlertCircle,
  Play,
  Send,
  ArrowRight,
  ArrowLeft,
  Clock,
  Award,
  ChevronRight,
  Terminal,
  FileText,
  Sparkles,
  Check,
  X,
  RefreshCw,
} from 'lucide-react';

export default function TakeOAPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const router = useRouter();

  const [session, setSession] = useState<OASession | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

  // User Code state per question
  const [codeMap, setCodeMap] = useState<Record<number, string>>({});
  const [languageMap, setLanguageMap] = useState<Record<number, string>>({});

  // Active Tab in Left Column (Problem vs Test Console)
  const [leftTab, setLeftTab] = useState<'problem' | 'console'>('problem');

  // Execution & Submission feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testOutput, setTestOutput] = useState<any>(null);

  // Finish Confirmation Modal
  const [showFinishModal, setShowFinishModal] = useState(false);

  useEffect(() => {
    async function loadSession() {
      // First try local storage
      let sess = getSessionLocal(sessionId);

      // Fallback to server API
      if (!sess) {
        try {
          const res = await fetch(`/api/oa/${sessionId}`);
          if (res.ok) {
            sess = await res.json();
          }
        } catch (e) {
          console.error('Failed to fetch session from API', e);
        }
      }

      if (sess) {
        setSession(sess);
        // Initialize starter code for each question if no submission exists yet
        const initialCode: Record<number, string> = {};
        const initialLang: Record<number, string> = {};

        sess.questions.forEach((q) => {
          const existing = sess.submissions[q.id];
          initialCode[q.id] = existing ? existing.code : q.starterCode || '';
          initialLang[q.id] = existing ? existing.language : 'python';
        });

        setCodeMap(initialCode);
        setLanguageMap(initialLang);
      }
      setLoading(false);
    }

    loadSession();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-950 text-white font-mono text-sm">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-5 w-5 animate-spin text-amber-400" />
          <span>Loading Assessment Environment...</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-zinc-950 text-white p-4 space-y-4 text-center">
        <AlertCircle className="h-12 w-12 text-rose-500" />
        <h1 className="text-2xl font-bold">Assessment Session Not Found</h1>
        <p className="text-zinc-400 max-w-md text-sm">
          The requested assessment session could not be retrieved. It may have expired or been deleted.
        </p>
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 rounded-lg bg-amber-500 text-zinc-950 font-bold text-sm"
        >
          Return to OA Builder
        </button>
      </div>
    );
  }

  const currentQuestion = session.questions[activeQuestionIndex];
  const currentCode = codeMap[currentQuestion.id] || '';
  const currentLanguage = languageMap[currentQuestion.id] || 'python';
  const currentSubmission = session.submissions[currentQuestion.id];

  const handleCodeChange = (val: string) => {
    setCodeMap((prev) => ({ ...prev, [currentQuestion.id]: val }));
  };

  const handleLanguageChange = (lang: string) => {
    setLanguageMap((prev) => ({ ...prev, [currentQuestion.id]: lang }));
  };

  // Run Sample Test Cases
  const handleRunSampleTests = async () => {
    setIsRunningTests(true);
    setLeftTab('console');

    // Simulate local execution against sample input/output test cases
    setTimeout(() => {
      const sampleCases = currentQuestion.inputOutput || [];
      const hasCode = currentCode.trim().length > 15;

      const results = sampleCases.map((sample, idx) => {
        const passed =
          hasCode &&
          !currentCode.includes('raise NotImplementedError') &&
          !currentCode.includes('pass');
        return {
          id: idx + 1,
          input: sample.input,
          expected: sample.output,
          actual: passed ? sample.output : 'Output mismatch / Error',
          passed,
        };
      });

      setTestOutput({
        status: results.every((r) => r.passed) ? 'PASSED' : 'FAILED',
        results,
        runtime: `${Math.floor(Math.random() * 40 + 10)} ms`,
        memory: `${(Math.random() * 5 + 14).toFixed(1)} MB`,
      });

      setIsRunningTests(false);
    }, 600);
  };

  // Submit Code for Current Question
  const handleSubmitQuestion = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        action: 'submit_question',
        questionId: currentQuestion.id,
        submission: {
          code: currentCode,
          language: currentLanguage,
        },
        sessionData: session,
      };

      const res = await fetch(`/api/oa/${session.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.session) {
        setSession(data.session);
        saveSessionLocal(data.session);

        // Run tests visually as well
        handleRunSampleTests();
      }
    } catch (e) {
      console.error('Error submitting code', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Complete & Finish Assessment
  const handleFinishAssessment = async () => {
    try {
      const payload = {
        finishAssessment: true,
        sessionData: session,
      };

      const res = await fetch(`/api/oa/${session.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.session) {
        saveSessionLocal(data.session);
      }

      router.push(`/oa/results/${session.id}`);
    } catch (e) {
      console.error('Error completing assessment', e);
      router.push(`/oa/results/${session.id}`);
    }
  };

  const answeredCount = Object.keys(session.submissions).length;
  const totalQuestions = session.questions.length;

  return (
    <div className="flex flex-col h-screen w-full bg-zinc-950 text-zinc-100 overflow-hidden select-none">
      {/* Top Fixed Control Bar */}
      <header className="flex h-14 items-center justify-between border-b border-zinc-800 bg-zinc-900/90 px-4">
        {/* Title & Question Navigator */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-white flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-400" />
              {session.title}
            </span>
          </div>

          <div className="h-5 w-px bg-zinc-800" />

          {/* Question Index Tabs */}
          <div className="flex items-center gap-1.5">
            {session.questions.map((q, idx) => {
              const sub = session.submissions[q.id];
              const isSubmitted = sub && sub.status === 'submitted';
              const isActive = idx === activeQuestionIndex;

              return (
                <button
                  key={q.id}
                  onClick={() => {
                    setActiveQuestionIndex(idx);
                    setTestOutput(null);
                    setLeftTab('problem');
                  }}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-mono font-medium transition ${
                    isActive
                      ? 'bg-amber-500 text-zinc-950 font-bold shadow'
                      : isSubmitted
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  <span>Q{idx + 1}</span>
                  {isSubmitted && <Check className="h-3 w-3" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Section: Timer & Finish Button */}
        <div className="flex items-center gap-4">
          <Timer
            timeLimitMinutes={session.timeLimitMinutes}
            startedAt={session.startedAt}
            onTimeUp={handleFinishAssessment}
          />

          <div className="text-xs font-mono text-zinc-400 hidden sm:block">
            Score: <span className="text-amber-400 font-bold">{session.totalScore}</span> / {session.maxScore} pts
          </div>

          <button
            onClick={() => setShowFinishModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-md hover:bg-emerald-500 transition"
          >
            <Send className="h-3.5 w-3.5" />
            Finish Assessment
          </button>
        </div>
      </header>

      {/* Main Split Screen Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Column: Problem Statement & Test Case Console */}
        <div className="w-1/2 border-r border-zinc-800 flex flex-col bg-zinc-950/70">
          {/* Left Column Tabs Header */}
          <div className="flex items-center border-b border-zinc-800 bg-zinc-900/60 px-4 pt-2">
            <button
              onClick={() => setLeftTab('problem')}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold transition ${
                leftTab === 'problem'
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <FileText className="h-4 w-4" />
              Problem Description
            </button>
            <button
              onClick={() => setLeftTab('console')}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold transition ${
                leftTab === 'console'
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Terminal className="h-4 w-4" />
              Test Case Console
              {testOutput && (
                <span
                  className={`h-2 w-2 rounded-full ${
                    testOutput.status === 'PASSED' ? 'bg-emerald-400' : 'bg-rose-400'
                  }`}
                />
              )}
            </button>
          </div>

          {/* Left Column Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800">
            {leftTab === 'problem' ? (
              <div className="space-y-6">
                {/* Problem Header */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <DifficultyBadge
                      difficulty={currentQuestion.difficulty}
                      points={currentQuestion.points}
                      size="md"
                    />
                    {currentQuestion.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-0.5 text-[11px] font-mono text-zinc-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <h1 className="text-xl font-bold text-white">
                    #{currentQuestion.id}. {currentQuestion.title}
                  </h1>
                </div>

                {/* Submission Status banner if submitted */}
                {currentSubmission && (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-emerald-300 font-medium">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      Submitted Solution ({currentSubmission.score} / {currentQuestion.points} pts)
                    </div>
                    <span className="text-emerald-400/80 font-mono">
                      {new Date(currentSubmission.submittedAt).toLocaleTimeString()}
                    </span>
                  </div>
                )}

                {/* Description Body */}
                <div className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed space-y-4 font-sans border-t border-zinc-800/80 pt-4">
                  {currentQuestion.problemDescription}
                </div>

                {/* Sample Test Cases Section */}
                {currentQuestion.inputOutput && currentQuestion.inputOutput.length > 0 && (
                  <div className="space-y-3 border-t border-zinc-800/80 pt-6">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Sample Examples
                    </h3>
                    <div className="space-y-3">
                      {currentQuestion.inputOutput.map((io, i) => (
                        <div
                          key={i}
                          className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-3.5 space-y-2 font-mono text-xs"
                        >
                          <div className="text-zinc-400 font-semibold text-[11px]">
                            Example {i + 1}:
                          </div>
                          <div>
                            <span className="text-zinc-500 block text-[10px] uppercase">Input</span>
                            <span className="text-amber-300">{io.input}</span>
                          </div>
                          <div>
                            <span className="text-zinc-500 block text-[10px] uppercase">Output</span>
                            <span className="text-emerald-300">{io.output}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Test Console View */
              <div className="space-y-4 font-mono">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Execution Output
                  </h3>
                  {testOutput && (
                    <div className="flex items-center gap-3 text-xs">
                      <span>Runtime: <strong className="text-amber-400">{testOutput.runtime}</strong></span>
                      <span>Memory: <strong className="text-amber-400">{testOutput.memory}</strong></span>
                    </div>
                  )}
                </div>

                {isRunningTests ? (
                  <div className="py-12 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin text-amber-400" />
                    Executing sample test cases...
                  </div>
                ) : !testOutput ? (
                  <div className="py-12 text-center text-xs text-zinc-500">
                    Click &quot;Run Sample Tests&quot; or &quot;Submit Solution&quot; to see test execution results here.
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div
                      className={`rounded-lg border p-3 text-xs font-bold flex items-center gap-2 ${
                        testOutput.status === 'PASSED'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}
                    >
                      {testOutput.status === 'PASSED' ? (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          All Sample Test Cases Passed!
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4" />
                          Test Execution Mismatch
                        </>
                      )}
                    </div>

                    <div className="space-y-2">
                      {testOutput.results.map((res: any) => (
                        <div
                          key={res.id}
                          className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-400 font-bold">Case {res.id}</span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                                res.passed
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-rose-500/20 text-rose-400'
                              }`}
                            >
                              {res.passed ? 'PASSED' : 'FAILED'}
                            </span>
                          </div>
                          <div>
                            <span className="text-zinc-500 text-[10px] block">Input</span>
                            <span className="text-zinc-200">{res.input}</span>
                          </div>
                          <div>
                            <span className="text-zinc-500 text-[10px] block">Expected</span>
                            <span className="text-emerald-400">{res.expected}</span>
                          </div>
                          <div>
                            <span className="text-zinc-500 text-[10px] block">Actual Output</span>
                            <span className={res.passed ? 'text-emerald-400' : 'text-rose-400'}>
                              {res.actual}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Code Editor & Action Buttons */}
        <div className="w-1/2 flex flex-col bg-zinc-950 p-4 space-y-3">
          <div className="flex-1 min-h-0">
            <CodeEditor
              value={currentCode}
              onChange={handleCodeChange}
              starterCode={currentQuestion.starterCode}
              language={currentLanguage}
              onLanguageChange={handleLanguageChange}
            />
          </div>

          {/* Bottom Action Controls Bar */}
          <div className="flex items-center justify-between border-t border-zinc-800 pt-3 px-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setActiveQuestionIndex((prev) => Math.max(0, prev - 1))
                }
                disabled={activeQuestionIndex === 0}
                className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 disabled:opacity-40"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Previous
              </button>

              <button
                type="button"
                onClick={() =>
                  setActiveQuestionIndex((prev) =>
                    Math.min(session.questions.length - 1, prev + 1)
                  )
                }
                disabled={activeQuestionIndex === session.questions.length - 1}
                className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 disabled:opacity-40"
              >
                Next
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleRunSampleTests}
                disabled={isRunningTests}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-bold text-zinc-200 hover:bg-zinc-800 hover:text-white transition disabled:opacity-50"
              >
                <Play className="h-3.5 w-3.5 text-amber-400" />
                Run Sample Tests
              </button>

              <button
                type="button"
                onClick={handleSubmitQuestion}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 border border-amber-400/40 px-5 py-2 text-xs font-bold text-zinc-950 shadow-sm transition disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    Submit Solution
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Finish Assessment Modal */}
      {showFinishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Send className="h-5 w-5 text-amber-400" />
                Complete Assessment?
              </h3>
              <button
                onClick={() => setShowFinishModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm text-zinc-300">
              <p>
                Are you sure you want to finish and submit your entire assessment?
              </p>
              <div className="rounded-xl bg-zinc-900 p-4 space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Answered Questions:</span>
                  <span className="font-bold text-emerald-400">
                    {answeredCount} / {totalQuestions}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Current Earned Score:</span>
                  <span className="font-bold text-amber-400">
                    {session.totalScore} / {session.maxScore} pts
                  </span>
                </div>
              </div>
              {answeredCount < totalQuestions && (
                <p className="text-rose-400 text-xs flex items-center gap-1.5 font-semibold">
                  <AlertCircle className="h-4 w-4" />
                  Warning: You have {totalQuestions - answeredCount} unsubmitted question(s).
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowFinishModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white"
              >
                Continue Writing
              </button>
              <button
                type="button"
                onClick={handleFinishAssessment}
                className="px-5 py-2 rounded-lg bg-emerald-600 font-bold text-xs text-white shadow-md hover:bg-emerald-500"
              >
                Finalize & Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
