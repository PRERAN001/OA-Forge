"use client";

import { useState, useEffect, useRef, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { OASession } from "@/types/oa";
import { getSessionLocal, saveSessionLocal } from "@/lib/sessionStore";
import { getStarterTemplate } from "@/lib/starterTemplates";
import DifficultyBadge from "@/components/DifficultyBadge";
import CodeEditor from "@/components/CodeEditor";
import Timer from "@/components/Timer";
import {
  CheckCircle2,
  AlertCircle,
  Play,
  Send,
  ArrowRight,
  ArrowLeft,
  Terminal,
  FileText,
  Sparkles,
  Check,
  X,
  RefreshCw,
  Lock,
  Maximize,
  Clock,
  Copy,
  XCircle,
} from "lucide-react";

type OutputState = "passed" | "failed" | "error";

type TestResult = {
  id?: string | number;
  passed?: boolean;
  input?: string;
  expected?: string;
  actual?: string;
  error?: unknown;
};

type TestOutput = {
  error?: unknown;
  status?: string;
  runtime?: string | number;
  memory?: string | number;
  results?: TestResult[];
  totalTests?: number;
  totalPassed?: number;
  hiddenStats?: {
    total: number;
    passed: number;
    allPassed: boolean;
  };
};

// Normalizes any execution outcome (Judge0 status strings, API errors, etc.)
const getOutputState = (o: TestOutput | null): OutputState => {
  if (!o) return "failed";
  if (
    o.error ||
    o.status === "ERROR" ||
    /error/i.test(String(o.status || ""))
  ) {
    return "error";
  }
  const allSample =
    Array.isArray(o.results) &&
    o.results.length > 0 &&
    o.results.every((r) => r.passed);
  const allHidden = o.hiddenStats ? o.hiddenStats.allPassed : true;
  return allSample && allHidden ? "passed" : "failed";
};

const formatError = (err: unknown): string => {
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err, null, 2);
  } catch {
    return String(err);
  }
};

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
  const [leftTab, setLeftTab] = useState<"problem" | "console">("problem");

  // Execution & Submission feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testOutput, setTestOutput] = useState<TestOutput | null>(null);
  const [selectedCaseTab, setSelectedCaseTab] = useState<number>(0);

  // Finish Confirmation Modal & Fullscreen State
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasEnteredFullscreen, setHasEnteredFullscreen] = useState(false);
  const [fsSupported, setFsSupported] = useState(false);
  const [fsError, setFsError] = useState("");
  const isFinishedRef = useRef(false);
  const [isFinished, setIsFinished] = useState(false);

  const enterFullscreen = async () => {
    setFsError("");
    try {
      if (
        typeof document !== "undefined" &&
        document.documentElement.requestFullscreen
      ) {
        setFsSupported(true);
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
        setHasEnteredFullscreen(true);
      } else {
        setFsSupported(false);
        setFsError("Fullscreen is not supported by this browser.");
      }
    } catch (error) {
      setFsError(
        error instanceof Error
          ? error.message
          : "Could not enter fullscreen mode.",
      );
      console.warn(
        "Fullscreen request prevented by browser security policy:",
        error,
      );
    }
  };

  const handleFinishAssessment = useCallback(async () => {
    if (isFinishedRef.current) return;
    isFinishedRef.current = true;
    setIsFinished(true);

    if (typeof document !== "undefined" && document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {}
    }

    try {
      const payload = {
        finishAssessment: true,
        sessionData: session,
      };

      if (!session?.id) return;

      const res = await fetch(`/api/oa/${session.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data?.session) {
        saveSessionLocal(data.session);
      }

      router.push(`/oa/results/${session.id}`);
    } catch (error) {
      console.error("Error completing assessment", error);
      if (session?.id) {
        router.push(`/oa/results/${session.id}`);
      }
    }
  }, [router, session]);

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
          console.error("Failed to fetch session from API", e);
        }
      }

      if (sess) {
        setSession(sess);
        const initialCode: Record<number, string> = {};
        const initialLang: Record<number, string> = {};

        sess.questions.forEach((q) => {
          const existing = sess.submissions[q.id];
          const savedLang =
            typeof window !== "undefined"
              ? localStorage.getItem(`oaforge_lang_${sessionId}_${q.id}`)
              : null;
          const lang = savedLang || (existing ? existing.language : "python");
          initialLang[q.id] = lang;

          const savedCode =
            typeof window !== "undefined"
              ? localStorage.getItem(
                  `oaforge_code_${sessionId}_${q.id}_${lang}`,
                )
              : null;

          if (savedCode !== null) {
            initialCode[q.id] = savedCode;
          } else if (existing && existing.language === lang) {
            initialCode[q.id] = existing.code;
          } else {
            initialCode[q.id] = getStarterTemplate(q, lang);
          }
        });

        setCodeMap(initialCode);
        setLanguageMap(initialLang);
      }
      setLoading(false);
    }

    loadSession();
  }, [sessionId]);

  // Fullscreen Enforcement & ESC key exit effect (Top level hook call)
  useEffect(() => {
    if (!session || loading) return;

    // Defer the request so the effect only subscribes to browser events
    const fullscreenRequest = window.setTimeout(() => {
      void enterFullscreen();
    }, 0);

    const handleFullscreenChange = () => {
      const isFS =
        typeof document !== "undefined" && !!document.fullscreenElement;
      setIsFullscreen(isFS);

      // If user exits fullscreen mode during active assessment, end assessment immediately
      if (!isFS && hasEnteredFullscreen && !isFinishedRef.current) {
        console.warn("User exited fullscreen mode. Ending assessment.");
        handleFinishAssessment();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isFinishedRef.current) {
        console.warn("User pressed Escape. Ending assessment.");
        handleFinishAssessment();
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(fullscreenRequest);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [session, loading, hasEnteredFullscreen, handleFinishAssessment]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#1a1a1a] text-white font-mono text-sm">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-5 w-5 animate-spin text-[#ffa116]" />
          <span>Loading Assessment Environment...</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-[#1a1a1a] text-white p-4 space-y-4 text-center">
        <AlertCircle className="h-12 w-12 text-rose-500" />
        <h1 className="text-2xl font-bold">Assessment Session Not Found</h1>
        <p className="text-zinc-400 max-w-md text-sm">
          The requested assessment session could not be retrieved. It may have
          expired or been deleted.
        </p>
        <button
          onClick={() => router.push("/")}
          className="px-4 py-2 rounded-lg bg-[#ffa116] text-[#1a1a1a] font-bold text-sm"
        >
          Return to OA Builder
        </button>
      </div>
    );
  }

  const currentQuestion = session.questions[activeQuestionIndex];
  const currentCode = codeMap[currentQuestion.id] || "";
  const currentLanguage = languageMap[currentQuestion.id] || "python";
  const currentSubmission = session.submissions[currentQuestion.id];

  const handleCodeChange = (val: string) => {
    setCodeMap((prev) => ({ ...prev, [currentQuestion.id]: val }));
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          `oaforge_code_${sessionId}_${currentQuestion.id}_${currentLanguage}`,
          val,
        );
      } catch {}
    }
  };

  const handleLanguageChange = (newLang: string) => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          `oaforge_code_${sessionId}_${currentQuestion.id}_${currentLanguage}`,
          currentCode,
        );
        localStorage.setItem(
          `oaforge_lang_${sessionId}_${currentQuestion.id}`,
          newLang,
        );
      } catch {}
    }

    let nextCode: string | null = null;
    if (typeof window !== "undefined") {
      nextCode = localStorage.getItem(
        `oaforge_code_${sessionId}_${currentQuestion.id}_${newLang}`,
      );
    }

    if (nextCode === null) {
      if (currentSubmission && currentSubmission.language === newLang) {
        nextCode = currentSubmission.code;
      } else {
        nextCode = getStarterTemplate(currentQuestion, newLang);
      }
    }

    setLanguageMap((prev) => ({ ...prev, [currentQuestion.id]: newLang }));
    setCodeMap((prev) => ({ ...prev, [currentQuestion.id]: nextCode! }));
  };

  const switchQuestion = (newIdx: number) => {
    if (newIdx === activeQuestionIndex) return;

    if (typeof window !== "undefined" && currentQuestion) {
      try {
        localStorage.setItem(
          `oaforge_code_${sessionId}_${currentQuestion.id}_${currentLanguage}`,
          currentCode,
        );
      } catch {}
    }

    const destQuestion = session?.questions[newIdx];
    if (destQuestion) {
      const savedLang =
        typeof window !== "undefined"
          ? localStorage.getItem(`oaforge_lang_${sessionId}_${destQuestion.id}`)
          : null;
      const targetLang =
        savedLang ||
        languageMap[destQuestion.id] ||
        session?.submissions[destQuestion.id]?.language ||
        "python";

      const savedCode =
        typeof window !== "undefined"
          ? localStorage.getItem(
              `oaforge_code_${sessionId}_${destQuestion.id}_${targetLang}`,
            )
          : null;

      let targetCode: string;
      if (savedCode !== null) {
        targetCode = savedCode;
      } else if (
        session?.submissions[destQuestion.id] &&
        session.submissions[destQuestion.id].language === targetLang
      ) {
        targetCode = session.submissions[destQuestion.id].code;
      } else if (
        codeMap[destQuestion.id] &&
        languageMap[destQuestion.id] === targetLang
      ) {
        targetCode = codeMap[destQuestion.id];
      } else {
        targetCode = getStarterTemplate(destQuestion, targetLang);
      }

      setLanguageMap((prev) => ({ ...prev, [destQuestion.id]: targetLang }));
      setCodeMap((prev) => ({ ...prev, [destQuestion.id]: targetCode }));
    }

    setActiveQuestionIndex(newIdx);
    setTestOutput(null);
    setLeftTab("problem");
  };

  // Run Sample Test Cases
  const handleRunSampleTests = async () => {
    setIsRunningTests(true);
    setLeftTab("console");

    try {
      const res = await fetch("/api/oa/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          code: currentCode,
          language: currentLanguage,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setTestOutput({
          status: "ERROR",
          error: data.details || data.error || `Request failed (${res.status})`,
          results: [],
        });
        return;
      }

      setTestOutput(data);
      setSelectedCaseTab(0);
    } catch (e) {
      setTestOutput({
        status: "ERROR",
        error:
          e instanceof Error
            ? e.message
            : "Network error: could not reach the code runner.",
        results: [],
      });
      setSelectedCaseTab(0);
    } finally {
      setIsRunningTests(false);
    }
  };

  // Submit Code for Current Question
  const handleSubmitQuestion = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        action: "submit_question",
        questionId: currentQuestion.id,
        submission: {
          code: currentCode,
          language: currentLanguage,
        },
        sessionData: session,
      };

      const res = await fetch(`/api/oa/${session.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setTestOutput({
          status: "ERROR",
          error: data.details || data.error || `Submit failed (${res.status})`,
          results: [],
        });
        setSelectedCaseTab(0);
        setLeftTab("console");
        return;
      }

      if (data.session) {
        setSession(data.session);
        saveSessionLocal(data.session);
      }

      if (data.execution) {
        setTestOutput(data.execution);
        setSelectedCaseTab(0);
        setLeftTab("console");
      }
    } catch (e) {
      console.error("Error submitting code", e);
      setTestOutput({
        status: "ERROR",
        error:
          e instanceof Error ? e.message : "Network error while submitting.",
        results: [],
      });
      setLeftTab("console");
    } finally {
      setIsSubmitting(false);
    }
  };

  const answeredCount = Object.keys(session.submissions).length;
  const totalQuestions = session.questions.length;
  const outputState = getOutputState(testOutput);

  return (
    <div className="flex flex-col h-screen w-full bg-[#1a1a1a] text-zinc-100 overflow-hidden select-none">
      {/* Top Fixed Control Bar */}
      <header className="flex h-14 items-center justify-between border-b border-[#383838] bg-[#282828] px-4">
        {/* Title & Question Navigator */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-white flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-[#ffa116]" />
              {session.title}
            </span>
          </div>

          <div className="h-5 w-px bg-[#383838]" />

          {/* Question Index Tabs */}
          <div className="flex items-center gap-1.5">
            {session.questions.map((q, idx) => {
              const sub = session.submissions[q.id];
              const isSubmitted = sub && sub.status === "submitted";
              const isActive = idx === activeQuestionIndex;

              return (
                <button
                  key={q.id}
                  onClick={() => switchQuestion(idx)}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-mono font-medium transition ${
                    isActive
                      ? "bg-[#ffa116] text-[#1a1a1a] font-bold shadow"
                      : isSubmitted
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-[#1e1e1e] text-zinc-400 hover:text-white"
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
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#1e1e1e] border border-[#383838] text-[11px] font-mono text-zinc-400">
            <Maximize className="h-3 w-3 text-[#ffa116]" />
            <span>Fullscreen Mode</span>
            <span className="text-rose-400 text-[10px] ml-1 font-sans">
              (Pressing ESC Ends OA)
            </span>
          </div>

          <Timer
            timeLimitMinutes={session.timeLimitMinutes}
            startedAt={session.startedAt}
            onTimeUp={handleFinishAssessment}
          />

          <div className="text-xs font-mono text-zinc-400 hidden sm:block">
            Score:{" "}
            <span className="text-[#ffa116] font-bold">
              {session.totalScore}
            </span>{" "}
            / {session.maxScore} pts
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
        <div className="w-1/2 border-r border-[#383838] flex flex-col bg-[#1a1a1a]">
          {/* Left Column Tabs Header */}
          <div className="flex items-center border-b border-[#383838] bg-[#282828] px-4 pt-2">
            <button
              onClick={() => setLeftTab("problem")}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold transition ${
                leftTab === "problem"
                  ? "border-[#ffa116] text-[#ffa116]"
                  : "border-transparent text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <FileText className="h-4 w-4" />
              Problem Description
            </button>
            <button
              onClick={() => setLeftTab("console")}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold transition ${
                leftTab === "console"
                  ? "border-[#ffa116] text-[#ffa116]"
                  : "border-transparent text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Terminal className="h-4 w-4" />
              Test Case Console
              {testOutput && (
                <span
                  className={`h-2 w-2 rounded-full ${
                    outputState === "passed"
                      ? "bg-emerald-400"
                      : outputState === "error"
                        ? "bg-amber-400"
                        : "bg-rose-400"
                  }`}
                />
              )}
            </button>
          </div>

          {/* Left Column Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800">
            {leftTab === "problem" ? (
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
                        className="rounded-full border border-[#383838] bg-[#282828] px-2.5 py-0.5 text-[11px] font-mono text-zinc-400"
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
                      Submitted Solution ({currentSubmission.score} /{" "}
                      {currentQuestion.points} pts)
                    </div>
                    <span className="text-emerald-400/80 font-mono">
                      {new Date(
                        currentSubmission.submittedAt,
                      ).toLocaleTimeString()}
                    </span>
                  </div>
                )}

                {/* Description Body */}
                <div className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed space-y-4 font-sans border-t border-[#383838] pt-4">
                  {currentQuestion.problemDescription}
                </div>

                {/* Sample Test Cases Section */}
                {currentQuestion.inputOutput &&
                  currentQuestion.inputOutput.length > 0 && (
                    <div className="space-y-3 border-t border-[#383838] pt-6">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                        Sample Examples
                      </h3>
                      <div className="space-y-3">
                        {currentQuestion.inputOutput.map((io, i) => (
                          <div
                            key={i}
                            className="rounded-xl border border-[#383838] bg-[#1e1e1e] p-3.5 space-y-2 font-mono text-xs"
                          >
                            <div className="text-zinc-400 font-semibold text-[11px]">
                              Example {i + 1}:
                            </div>
                            <div>
                              <span className="text-zinc-500 block text-[10px] uppercase">
                                Input
                              </span>
                              <span className="text-[#ffa116]">{io.input}</span>
                            </div>
                            <div>
                              <span className="text-zinc-500 block text-[10px] uppercase">
                                Output
                              </span>
                              <span className="text-emerald-300">
                                {io.output}
                              </span>
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
                      {testOutput.runtime && (
                        <span>
                          Runtime:{" "}
                          <strong className="text-[#ffa116]">
                            {testOutput.runtime}
                          </strong>
                        </span>
                      )}
                      {testOutput.memory && (
                        <span>
                          Memory:{" "}
                          <strong className="text-[#ffa116]">
                            {testOutput.memory}
                          </strong>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {isRunningTests ? (
                  <div className="py-12 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin text-[#ffa116]" />
                    Executing sample test cases...
                  </div>
                ) : !testOutput ? (
                  <div className="py-12 text-center text-xs text-zinc-500">
                    Click &quot;Run Sample Tests&quot; or &quot;Submit
                    Solution&quot; to see test execution results here.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Status banner */}
                    <div
                      className={`rounded-lg border p-3 text-xs font-bold flex items-center justify-between ${
                        testOutput.status === "COMPILE_ERROR" || testOutput.status === "RUNTIME_ERROR" || outputState === "failed"
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                          : testOutput.status === "TIME_LIMIT_EXCEEDED"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            : outputState === "passed"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {testOutput.status === "COMPILE_ERROR" ? (
                          <>
                            <XCircle className="h-4 w-4 text-rose-400" />
                            Compile Error
                          </>
                        ) : testOutput.status === "RUNTIME_ERROR" ? (
                          <>
                            <AlertCircle className="h-4 w-4 text-rose-400" />
                            Runtime Error
                          </>
                        ) : testOutput.status === "TIME_LIMIT_EXCEEDED" ? (
                          <>
                            <Clock className="h-4 w-4 text-amber-400" />
                            Time Limit Exceeded
                          </>
                        ) : outputState === "passed" ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            Accepted
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 text-rose-400" />
                            Wrong Answer
                          </>
                        )}
                      </div>

                      {/* Summary indicator */}
                      {(testOutput.totalTests ?? 0) > 0 && testOutput.status !== "COMPILE_ERROR" && (
                        <div className="text-[11px] font-mono font-normal opacity-90">
                          {testOutput.totalPassed ?? 0} / {testOutput.totalTests ?? 0} test cases passed
                        </div>
                      )}
                    </div>

                    {/* 1. Compile Error Output (LeetCode Compiler View) */}
                    {testOutput.status === "COMPILE_ERROR" ? (
                      <div className="rounded-xl border border-rose-500/30 bg-[#161616] overflow-hidden shadow-lg">
                        <div className="flex items-center justify-between px-3.5 py-2 bg-rose-500/10 border-b border-rose-500/20 text-xs">
                          <span className="font-mono font-semibold text-rose-400 flex items-center gap-1.5">
                            <Terminal className="h-3.5 w-3.5" />
                            Compiler Message
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (testOutput.error) {
                                navigator.clipboard.writeText(formatError(testOutput.error));
                              }
                            }}
                            className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 transition"
                          >
                            <Copy className="h-3 w-3" />
                            Copy
                          </button>
                        </div>
                        <pre className="p-4 font-mono text-[11.5px] leading-relaxed text-rose-300/90 whitespace-pre-wrap overflow-x-auto max-h-[420px] select-text">
                          {formatError(testOutput.error)}
                        </pre>
                      </div>
                    ) : testOutput.status === "RUNTIME_ERROR" && (!testOutput.results || testOutput.results.length === 0) ? (
                      /* 2. Top-level Runtime Error (Crashed before executing tests) */
                      <div className="rounded-xl border border-rose-500/30 bg-[#161616] overflow-hidden shadow-lg">
                        <div className="flex items-center justify-between px-3.5 py-2 bg-rose-500/10 border-b border-rose-500/20 text-xs font-mono font-semibold text-rose-400">
                          <span className="flex items-center gap-1.5">
                            <AlertCircle className="h-3.5 w-3.5" />
                            Runtime Exception
                          </span>
                        </div>
                        <pre className="p-4 font-mono text-[11.5px] leading-relaxed text-rose-300 whitespace-pre-wrap overflow-x-auto max-h-[420px] select-text">
                          {formatError(testOutput.error)}
                        </pre>
                      </div>
                    ) : testOutput.status === "TIME_LIMIT_EXCEEDED" ? (
                      /* 3. Time Limit Exceeded View */
                      <div className="rounded-xl border border-amber-500/30 bg-[#161616] p-4 text-xs font-mono space-y-2">
                        <div className="text-amber-400 font-semibold flex items-center gap-1.5">
                          <Clock className="h-4 w-4" />
                          Time Limit Exceeded
                        </div>
                        <p className="text-zinc-400 text-[11px] leading-relaxed">
                          Your solution took longer than 5.0 seconds to finish. Check for infinite loops or inefficient algorithms.
                        </p>
                      </div>
                    ) : null}

                    {/* Generic / Server Error fallback */}
                    {testOutput.status === "ERROR" && Boolean(testOutput.error) && (
                      <div className="rounded-xl border border-amber-500/30 bg-[#161616] p-4 text-xs font-mono space-y-2">
                        <div className="text-amber-400 font-semibold flex items-center gap-1.5">
                          <AlertCircle className="h-4 w-4" />
                          Execution Warning
                        </div>
                        <pre className="text-amber-300/90 whitespace-pre-wrap text-[11px] leading-relaxed max-h-56 overflow-y-auto">
                          {formatError(testOutput.error)}
                        </pre>
                      </div>
                    )}

                    {/* 4. Per-case results (LeetCode Tabbed View) */}
                    {testOutput.results && testOutput.results.length > 0 && (
                      <div className="space-y-3 font-mono">
                        {/* Case Navigation Tabs */}
                        <div className="flex items-center gap-1.5 border-b border-[#333] pb-2 overflow-x-auto">
                          {testOutput.results.map((res, idx) => {
                            const isSelected = (selectedCaseTab ?? 0) === idx;
                            return (
                              <button
                                key={res.id ?? idx}
                                type="button"
                                onClick={() => setSelectedCaseTab(idx)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition ${
                                  isSelected
                                    ? "bg-[#282828] text-white font-bold border border-[#444] shadow-sm"
                                    : "text-zinc-400 hover:text-zinc-200 hover:bg-[#202020]"
                                }`}
                              >
                                <span
                                  className={`h-2 w-2 rounded-full ${
                                    res.passed ? "bg-emerald-400" : "bg-rose-400"
                                  }`}
                                />
                                Case {res.id ?? idx + 1}
                              </button>
                            );
                          })}
                        </div>

                        {/* Selected Case Content */}
                        {(() => {
                          const currentRes =
                            testOutput.results[selectedCaseTab] ||
                            testOutput.results[0];
                          if (!currentRes) return null;

                          return (
                            <div className="space-y-3 pt-1">
                              <div>
                                <span className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider block mb-1">
                                  Input
                                </span>
                                <div className="rounded-lg bg-[#202020] border border-[#333] p-3 text-zinc-200 text-xs whitespace-pre-wrap break-all">
                                  {formatError(currentRes.input)}
                                </div>
                              </div>

                              <div>
                                <span className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider block mb-1">
                                  Output
                                </span>
                                <div
                                  className={`rounded-lg bg-[#202020] border p-3 text-xs whitespace-pre-wrap break-all ${
                                    currentRes.passed
                                      ? "border-emerald-500/30 text-emerald-400"
                                      : "border-rose-500/30 text-rose-400"
                                  }`}
                                >
                                  {formatError(currentRes.actual)}
                                </div>
                              </div>

                              <div>
                                <span className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider block mb-1">
                                  Expected
                                </span>
                                <div className="rounded-lg bg-[#202020] border border-[#333] p-3 text-emerald-400 text-xs whitespace-pre-wrap break-all">
                                  {formatError(currentRes.expected)}
                                </div>
                              </div>

                              {Boolean(currentRes.error) && (
                                <div>
                                  <span className="text-rose-400 text-[10px] uppercase font-bold tracking-wider block mb-1">
                                    Runtime Error
                                  </span>
                                  <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-3 text-rose-300 text-xs whitespace-pre-wrap">
                                    {formatError(currentRes.error)}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* Hidden test stats (only shown after Submit, not Run) */}
                    {testOutput.hiddenStats &&
                      testOutput.hiddenStats.total > 0 && (
                        <div className="rounded-lg border border-[#383838] bg-[#1e1e1e] p-3 text-xs flex items-center justify-between">
                          <span className="text-zinc-400 flex items-center gap-1.5 font-mono">
                            <Lock className="h-3.5 w-3.5 text-zinc-500" />
                            Hidden Test Cases
                          </span>
                          <span
                            className={`font-mono font-bold ${
                              testOutput.hiddenStats.allPassed
                                ? "text-emerald-400"
                                : "text-rose-400"
                            }`}
                          >
                            {testOutput.hiddenStats.passed} /{" "}
                            {testOutput.hiddenStats.total} passed
                          </span>
                        </div>
                      )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Code Editor & Action Buttons */}
        <div className="w-1/2 flex flex-col bg-[#1a1a1a] p-4 space-y-3">
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
          <div className="flex items-center justify-between border-t border-[#383838] pt-3 px-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  switchQuestion(Math.max(0, activeQuestionIndex - 1))
                }
                disabled={activeQuestionIndex === 0}
                className="flex items-center gap-1 rounded-lg border border-[#383838] bg-[#282828] px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-[#383838] disabled:opacity-40"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Previous
              </button>

              <button
                type="button"
                onClick={() =>
                  switchQuestion(
                    Math.min(
                      session.questions.length - 1,
                      activeQuestionIndex + 1,
                    ),
                  )
                }
                disabled={activeQuestionIndex === session.questions.length - 1}
                className="flex items-center gap-1 rounded-lg border border-[#383838] bg-[#282828] px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-[#383838] disabled:opacity-40"
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
                className="flex items-center gap-1.5 rounded-lg border border-[#383838] bg-[#282828] px-4 py-2 text-xs font-bold text-zinc-200 hover:bg-[#383838] hover:text-white transition disabled:opacity-50"
              >
                <Play className="h-3.5 w-3.5 text-[#ffa116]" />
                Run Sample Tests
              </button>

              <button
                type="button"
                onClick={handleSubmitQuestion}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 rounded-lg bg-[#ffa116] hover:bg-[#ffa116]/90 border border-[#ffa116]/40 px-5 py-2 text-xs font-bold text-[#1a1a1a] shadow-sm transition disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#121212]/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#383838] bg-[#282828] p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#383838] pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Send className="h-5 w-5 text-[#ffa116]" />
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
                Are you sure you want to finish and submit your entire
                assessment?
              </p>
              <div className="rounded-xl bg-[#1e1e1e] border border-[#383838] p-4 space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Answered Questions:</span>
                  <span className="font-bold text-emerald-400">
                    {answeredCount} / {totalQuestions}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Current Earned Score:</span>
                  <span className="font-bold text-[#ffa116]">
                    {session.totalScore} / {session.maxScore} pts
                  </span>
                </div>
              </div>
              {answeredCount < totalQuestions && (
                <p className="text-rose-400 text-xs flex items-center gap-1.5 font-semibold">
                  <AlertCircle className="h-4 w-4" />
                  Warning: You have {totalQuestions - answeredCount} unsubmitted
                  question(s).
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

      {/* Fullscreen Required Overlay Modal */}
      {!isFullscreen && !isFinished && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="fs-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1a1a1a]/95 backdrop-blur-md p-4"
        >
          <div className="w-full max-w-md rounded-2xl border border-[#383838] bg-[#282828] p-6 space-y-6 text-center shadow-2xl">
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#ffa116]/10 border border-[#ffa116]/30">
                <Maximize className="h-6 w-6 text-[#ffa116]" />
              </div>
              <h2 id="fs-title" className="text-xl font-bold text-white">
                Fullscreen Mode Required
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                This online assessment runs in mandatory Fullscreen Mode.
                Exiting fullscreen or pressing{" "}
                <kbd className="px-1.5 py-0.5 rounded bg-[#1e1e1e] border border-[#383838] text-[#ffa116] font-mono">
                  ESC
                </kbd>{" "}
                will automatically finalize and submit your assessment.
              </p>
            </div>

            {!fsSupported ? (
              <p className="text-xs text-rose-400">
                Your browser doesn&apos;t support fullscreen. Please use a
                desktop browser such as Chrome, Edge, or Firefox.
              </p>
            ) : (
              <button
                type="button"
                autoFocus
                onClick={enterFullscreen}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#ffa116] px-4 py-3 text-xs font-bold text-[#1a1a1a] hover:bg-[#ffa116]/90 transition shadow-md"
              >
                <Maximize className="h-4 w-4" />
                Click to Enter Fullscreen Assessment
              </button>
            )}

            {fsError && <p className="text-xs text-rose-400">{fsError}</p>}
          </div>
        </div>
      )}
    </div>
  );
}