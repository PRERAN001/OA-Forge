'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  getUserCredits,
  fetchUserCreditsFromDB,
  submitQuestionContribution,
  getContributedQuestions,
  ContributedQuestion,
} from '@/lib/userCredits';
import DifficultyBadge from '@/components/DifficultyBadge';
import {
  FilePlus,
  Award,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Code,
  BookOpen,
  Sparkles,
  HelpCircle,
  Layers,
} from 'lucide-react';
import DifficultyBadgeComponent from '@/components/DifficultyBadge';

export default function ContributePage() {
  const router = useRouter();

  // User Contribution Stats State
  const [totalContributed, setTotalContributed] = useState(0);
  const [credits, setCredits] = useState(1);
  const [recentContributions, setRecentContributions] = useState<ContributedQuestion[]>([]);

  // Form State
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Array', 'Dynamic Programming']);
  const [tagInput, setTagInput] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [starterCode, setStarterCode] = useState(
    'class Solution:\n    def solve(self):\n        # Write your solution here\n        pass'
  );

  // Standard Test Cases
  const [testCases, setTestCases] = useState<Array<{ input: string; output: string }>>([
    { input: 'nums = [2, 7, 11, 15], target = 9', output: '[0, 1]' },
    { input: 'nums = [3, 2, 4], target = 6', output: '[1, 2]' },
  ]);

  // Edge Cases (Crucial Requirement)
  const [edgeCases, setEdgeCases] = useState<
    Array<{ title: string; input: string; output: string; explanation: string }>
  >([
    {
      title: 'Empty or Single Element Input',
      input: 'nums = [], target = 0',
      output: '[]',
      explanation: 'Handles zero-length array gracefully without index out of bounds error.',
    },
    {
      title: 'Large / Boundary Values',
      input: 'nums = [10**9, 10**9], target = 2*10**9',
      output: '[0, 1]',
      explanation: 'Verifies integer overflow handling for large constraints.',
    },
  ]);

  // Submission Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successReward, setSuccessReward] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: session } = useSession();

  useEffect(() => {
    const update = () => {
      const userState = getUserCredits();
      setTotalContributed(userState.contributedCount);
      setCredits(userState.credits);
      setRecentContributions(getContributedQuestions());
    };
    update();

    fetchUserCreditsFromDB(session?.user?.email || undefined).then(update);
    window.addEventListener('aura_credits_updated', update);
    return () => window.removeEventListener('aura_credits_updated', update);
  }, [session?.user?.email]);

  const progressInCurrentTier = totalContributed % 3;
  const neededForNextCredit = 3 - progressInCurrentTier;

  const handleAddTestCase = () => {
    setTestCases([...testCases, { input: '', output: '' }]);
  };

  const handleRemoveTestCase = (index: number) => {
    setTestCases(testCases.filter((_, i) => i !== index));
  };

  const handleAddEdgeCase = () => {
    setEdgeCases([
      ...edgeCases,
      { title: '', input: '', output: '', explanation: '' },
    ]);
  };

  const handleRemoveEdgeCase = (index: number) => {
    setEdgeCases(edgeCases.filter((_, i) => i !== index));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !selectedTags.includes(tagInput.trim())) {
      setSelectedTags([...selectedTags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessReward(null);
    setErrorMessage(null);

    if (!title.trim()) {
      alert('Please enter a question title.');
      return;
    }

    if (!problemDescription.trim() || problemDescription.trim().length < 30) {
      alert('Please enter a detailed problem description (at least 30 characters).');
      return;
    }

    if (testCases.some((tc) => !tc.input.trim() || !tc.output.trim())) {
      alert('Please complete all standard test case inputs and outputs.');
      return;
    }

    if (edgeCases.some((ec) => !ec.title.trim() || !ec.input.trim())) {
      alert('Please complete all edge case scenarios.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await submitQuestionContribution({
        title,
        difficulty,
        tags: selectedTags,
        problemDescription,
        testCases,
        edgeCases,
        starterCode,
      });

      setIsSubmitting(false);

      if (!res.success) {
        setErrorMessage(res.error || 'This question already exists in the online database.');
        return;
      }

      const userState = getUserCredits();
      setTotalContributed(userState.contributedCount);
      setCredits(userState.credits);
      setRecentContributions(getContributedQuestions());

      if (res.creditsEarned > 0) {
        setSuccessReward(
          `🎉 Congratulations! You submitted 3 questions and earned 1 FREE OA Credit!`
        );
      } else {
        setSuccessReward(
          `Question submitted successfully! Contribute ${3 - (res.totalContributed % 3)} more question(s) to earn your next free OA pass!`
        );
      }

      // Reset Form fields
      setTitle('');
      setProblemDescription('');
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err?.message || 'Failed to submit question to database.');
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header Banner */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs font-mono text-zinc-300">
              <FilePlus className="h-3.5 w-3.5 text-amber-400" />
              Community Question Pool
            </div>
            <h1 className="text-2xl font-bold text-white">
              Contribute 3 Questions = Get 1 Free OA
            </h1>
            <p className="text-zinc-400 text-xs max-w-xl">
              Don&apos;t want to pay for OA passes? Submit 3 high-quality algorithm problems (with problem descriptions, test cases, and edge cases) to earn 1 free OA credit!
            </p>
          </div>

          {/* User Progress Tracker Card */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 min-w-[240px] space-y-3 font-mono">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Contribution Goal</span>
              <span className="font-bold text-amber-400">
                {progressInCurrentTier} / 3 Questions
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-300"
                style={{ width: `${(progressInCurrentTier / 3) * 100}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
              <span>Current Credits: <strong className="text-white">{credits}</strong></span>
              <span className="text-amber-400 font-medium">
                {neededForNextCredit === 3 ? 'Start Next Pass' : `${neededForNextCredit} more to +1 OA`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Error / Duplicate Notification Alert */}
      {errorMessage && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-xs font-medium text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-rose-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-zinc-400 hover:text-white"
          >
            ×
          </button>
        </div>
      )}

      {/* Success Notification Alert */}
      {successReward && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-xs font-medium text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
            <span>{successReward}</span>
          </div>
          <button
            onClick={() => router.push('/')}
            className="px-3 py-1.5 rounded-lg bg-emerald-500 text-zinc-950 font-bold text-xs hover:bg-emerald-400"
          >
            Use OA Credit Now
          </button>
        </div>
      )}

      {/* Contribution Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-6">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-amber-400" />
            1. Problem Overview & Classification
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Question Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Find Minimum in Rotated Sorted Array"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Difficulty Rating *
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-200 focus:border-amber-500 focus:outline-none"
              >
                <option value="Easy">Easy (100 pts)</option>
                <option value="Medium">Medium (200 pts)</option>
                <option value="Hard">Hard (400 pts)</option>
              </select>
            </div>
          </div>

          {/* Topic Tags */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-zinc-400">
              Topic Tags (e.g. Array, Binary Search, Dynamic Programming)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Add a topic tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="flex-1 max-w-xs rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200"
              >
                Add Tag
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {selectedTags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded bg-zinc-800 px-2.5 py-1 text-xs font-mono text-zinc-300 border border-zinc-700/60"
                >
                  {t}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="text-zinc-500 hover:text-rose-400"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Problem Description & Constraints */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Code className="h-4 w-4 text-amber-400" />
            2. Detailed Problem Statement & Constraints *
          </h2>
          <textarea
            rows={6}
            required
            placeholder="Given an integer array nums of size n... Describe constraints, input format, and expected time complexity."
            value={problemDescription}
            onChange={(e) => setProblemDescription(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-3 text-xs text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none font-mono leading-relaxed"
          />
        </div>

        {/* Standard Test Cases */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="h-4 w-4 text-amber-400" />
              3. Standard Test Cases *
            </h2>
            <button
              type="button"
              onClick={handleAddTestCase}
              className="flex items-center gap-1 text-xs font-semibold text-amber-400 hover:underline"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Test Case
            </button>
          </div>

          <div className="space-y-3">
            {testCases.map((tc, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-zinc-800 bg-zinc-950 p-3.5 space-y-2 text-xs font-mono"
              >
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="font-bold">Test Case #{idx + 1}</span>
                  {testCases.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTestCase(idx)}
                      className="text-zinc-500 hover:text-rose-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase mb-1">
                      Input Example
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="nums = [1, 2, 3], target = 4"
                      value={tc.input}
                      onChange={(e) => {
                        const updated = [...testCases];
                        updated[idx].input = e.target.value;
                        setTestCases(updated);
                      }}
                      className="w-full rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-amber-300 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase mb-1">
                      Expected Output
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="[0, 2]"
                      value={tc.output}
                      onChange={(e) => {
                        const updated = [...testCases];
                        updated[idx].output = e.target.value;
                        setTestCases(updated);
                      }}
                      className="w-full rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-emerald-300 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Edge Cases Section (Explicit Requirement) */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-amber-400" />
                4. Edge Cases & Boundary Conditions *
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Specify boundary inputs such as empty arrays, single elements, negative numbers, or maximum limits.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddEdgeCase}
              className="flex items-center gap-1 text-xs font-semibold text-amber-400 hover:underline"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Edge Case
            </button>
          </div>

          <div className="space-y-3">
            {edgeCases.map((ec, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 space-y-3 text-xs font-mono"
              >
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    required
                    placeholder="Edge Case Title (e.g. Empty Array Input)"
                    value={ec.title}
                    onChange={(e) => {
                      const updated = [...edgeCases];
                      updated[idx].title = e.target.value;
                      setEdgeCases(updated);
                    }}
                    className="w-full max-w-sm rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs font-bold text-white focus:border-amber-500 focus:outline-none"
                  />
                  {edgeCases.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveEdgeCase(idx)}
                      className="text-zinc-500 hover:text-rose-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase mb-1">
                      Edge Case Input
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="nums = [], n = 0"
                      value={ec.input}
                      onChange={(e) => {
                        const updated = [...edgeCases];
                        updated[idx].input = e.target.value;
                        setEdgeCases(updated);
                      }}
                      className="w-full rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-amber-300 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase mb-1">
                      Edge Case Expected Output
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="-1"
                      value={ec.output}
                      onChange={(e) => {
                        const updated = [...edgeCases];
                        updated[idx].output = e.target.value;
                        setEdgeCases(updated);
                      }}
                      className="w-full rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-emerald-300 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-500 uppercase mb-1">
                    Explanation / Rational
                  </label>
                  <input
                    type="text"
                    placeholder="Explains why this edge case test is necessary..."
                    value={ec.explanation}
                    onChange={(e) => {
                      const updated = [...edgeCases];
                      updated[idx].explanation = e.target.value;
                      setEdgeCases(updated);
                    }}
                    className="w-full rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-300 focus:border-amber-500 focus:outline-none font-sans"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submission Action */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 px-6 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold border border-amber-400/40 text-sm transition shadow-lg flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <span>Submitting Question Contribution...</span>
          ) : (
            <>
              <FilePlus className="h-4 w-4" />
              Submit Question ({progressInCurrentTier}/3 Submitted towards Next Free OA)
            </>
          )}
        </button>
      </form>
    </div>
  );
}
