import { Question } from '@/types/oa';

export interface UserCreditsState {
  credits: number; // OA credits balance
  contributedCount: number; // Total questions contributed (every 3 gives 1 credit)
  isUnlimited: boolean; // True if purchased 3-month unlimited pass
  unlimitedExpiry?: string;
  history: Array<{
    id: string;
    type: 'free_initial' | 'purchase' | 'contribution';
    amount: number;
    description: string;
    timestamp: string;
  }>;
}

let inMemoryCreditsState: UserCreditsState = {
  credits: 1,
  contributedCount: 0,
  isUnlimited: false,
  history: [
    {
      id: 'init',
      type: 'free_initial',
      amount: 1,
      description: 'Initial Free Assessment Credit',
      timestamp: new Date().toISOString(),
    },
  ],
};

const CONTRIBUTIONS_STORAGE_KEY = 'aura_contributed_questions_v1';

export function getUserCredits(): UserCreditsState {
  // Auto-expire unlimited pass if expired
  if (inMemoryCreditsState.isUnlimited && inMemoryCreditsState.unlimitedExpiry) {
    if (new Date(inMemoryCreditsState.unlimitedExpiry).getTime() < Date.now()) {
      inMemoryCreditsState.isUnlimited = false;
      inMemoryCreditsState.unlimitedExpiry = undefined;
      saveUserCredits(inMemoryCreditsState);
    }
  }

  return inMemoryCreditsState;
}

export async function fetchUserCreditsFromDB(email?: string): Promise<UserCreditsState> {
  try {
    const url = email ? `/api/user/credits?email=${encodeURIComponent(email)}` : '/api/user/credits';
    const res = await fetch(url);
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const dbData = (await res.json()) as {
        credits?: number;
        isUnlimited?: boolean;
        unlimitedExpiry?: string;
        contributedCount?: number;
      };
      if (dbData.credits !== undefined) {
        inMemoryCreditsState.credits = dbData.credits;
        inMemoryCreditsState.isUnlimited = !!dbData.isUnlimited;
        inMemoryCreditsState.unlimitedExpiry = dbData.unlimitedExpiry;
        inMemoryCreditsState.contributedCount = dbData.contributedCount ?? 0;

        // Auto-expire 3-month pass if expired
        if (inMemoryCreditsState.isUnlimited && inMemoryCreditsState.unlimitedExpiry) {
          if (new Date(inMemoryCreditsState.unlimitedExpiry).getTime() < Date.now()) {
            inMemoryCreditsState.isUnlimited = false;
            inMemoryCreditsState.unlimitedExpiry = undefined;
            saveUserCredits(inMemoryCreditsState);
          }
        }

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('aura_credits_updated'));
        }
      }
    } else if (!contentType.includes('application/json')) {
      console.warn(`Credits API returned a non-JSON response (${res.status}).`);
    }
  } catch (e) {
    console.error('Failed to fetch user credits from DB:', e);
  }
  return inMemoryCreditsState;
}

export async function syncUserCreditsWithDB(email: string): Promise<UserCreditsState> {
  return await fetchUserCreditsFromDB(email);
}

export async function saveUserCredits(state: UserCreditsState): Promise<void> {
  inMemoryCreditsState = { ...state };
  if (typeof window === 'undefined') return;
  try {
    await fetch('/api/user/credits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        credits: state.credits,
        isUnlimited: state.isUnlimited,
        unlimitedExpiry: state.unlimitedExpiry,
        contributedCount: state.contributedCount,
      }),
    });
    window.dispatchEvent(new Event('aura_credits_updated'));
  } catch (e) {
    console.error('Failed to save credits state to DB:', e);
  }
}

export function resetUserCredits(amount = 1): UserCreditsState {
  const state: UserCreditsState = {
    credits: amount,
    contributedCount: 0,
    isUnlimited: false,
    history: [
      {
        id: 'reset_' + Date.now(),
        type: 'free_initial',
        amount,
        description: 'Free Assessment Credit Refilled',
        timestamp: new Date().toISOString(),
      },
    ],
  };
  saveUserCredits(state);
  return state;
}

export function useOACredit(): { success: boolean; message: string; remainingCredits: number } {
  const state = getUserCredits();

  // Check 3-month pass expiry
  if (state.isUnlimited) {
    if (state.unlimitedExpiry && new Date(state.unlimitedExpiry).getTime() < Date.now()) {
      state.isUnlimited = false;
      state.unlimitedExpiry = undefined;
      saveUserCredits(state);
    } else {
      return { success: true, message: '3 Months Unlimited Pass Active', remainingCredits: 999 };
    }
  }

  if (state.credits <= 0) {
    return {
      success: false,
      message: 'You have 0 OA credits remaining. Purchase ₹99 Unlimited Pass or contribute 3 questions to unlock!',
      remainingCredits: 0,
    };
  }

  state.credits = Math.max(0, state.credits - 1);
  saveUserCredits(state);

  return { success: true, message: '1 Credit Used', remainingCredits: state.credits };
}

export function checkOACredit(): { success: boolean; message: string; remainingCredits: number } {
  const state = getUserCredits();

  // Check 3-month pass expiry
  if (state.isUnlimited) {
    if (state.unlimitedExpiry && new Date(state.unlimitedExpiry).getTime() < Date.now()) {
      state.isUnlimited = false;
      state.unlimitedExpiry = undefined;
      saveUserCredits(state);
    } else {
      return { success: true, message: '3 Months Unlimited Pass Active', remainingCredits: 999 };
    }
  }

  if (state.credits <= 0) {
    return {
      success: false,
      message: 'You have 0 OA credits remaining. Purchase ₹99 Unlimited Pass or contribute 3 questions to unlock!',
      remainingCredits: 0,
    };
  }

  return { success: true, message: 'Credit available', remainingCredits: state.credits };
}

export function addOACredits(
  amount: number,
  type: 'purchase' | 'contribution',
  description: string,
  setUnlimited = false
): UserCreditsState {
  const state = getUserCredits();
  if (setUnlimited) {
    state.isUnlimited = true;
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + 3);
    state.unlimitedExpiry = expiry.toISOString();
  }
  state.credits += amount;
  state.history.unshift({
    id: 'tx_' + Math.random().toString(36).substring(2, 9),
    type,
    amount,
    description,
    timestamp: new Date().toISOString(),
  });

  saveUserCredits(state);
  return state;
}

export interface ContributedQuestion {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  problemDescription: string;
  testCases: Array<{ input: string; output: string }>;
  edgeCases: Array<{ title: string; input: string; output: string; explanation?: string }>;
  starterCode?: string;
  submittedAt: string;
}

export function getContributedQuestions(): ContributedQuestion[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CONTRIBUTIONS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export async function submitQuestionContributionAsync(
  question: Omit<ContributedQuestion, 'id' | 'submittedAt'>
): Promise<{
  success: boolean;
  error?: string;
  totalContributed: number;
  creditsEarned: number;
  progressInCurrentTier: number;
}> {
  const state = getUserCredits();

  try {
    const res = await fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(question),
    });

    const data = await res.json();

    if (!res.ok || !data.question) {
      return {
        success: false,
        error: data.error || `The question "${question.title}" already exists in the database or failed validation.`,
        totalContributed: state.contributedCount,
        creditsEarned: 0,
        progressInCurrentTier: state.contributedCount % 3,
      };
    }

    state.contributedCount += 1;
    let creditsEarned = 0;

    // Every 3 contributed questions awards 1 free OA credit!
    if (state.contributedCount % 3 === 0) {
      creditsEarned = 1;
      state.credits += 1;
      state.history.unshift({
        id: 'contrib_reward_' + Date.now(),
        type: 'contribution',
        amount: 1,
        description: `Earned 1 OA Credit for contributing ${state.contributedCount} questions!`,
        timestamp: new Date().toISOString(),
      });
    }

    await saveUserCredits(state);

    const progressInCurrentTier = state.contributedCount % 3 === 0 ? 3 : state.contributedCount % 3;

    return {
      success: true,
      totalContributed: state.contributedCount,
      creditsEarned,
      progressInCurrentTier,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Failed to submit question to online database.',
      totalContributed: state.contributedCount,
      creditsEarned: 0,
      progressInCurrentTier: state.contributedCount % 3,
    };
  }
}

export function submitQuestionContribution(
  question: Omit<ContributedQuestion, 'id' | 'submittedAt'>
) {
  // Sync fallback calling async submit
  return submitQuestionContributionAsync(question);
}
