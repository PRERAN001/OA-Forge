import { getAllQuestions } from '@/lib/questions';

export interface UserCreditsState {
  credits: number; // OA credits balance (starts at 1)
  contributedCount: number; // Total questions contributed (every 3 gives 1 credit)
  isUnlimited: boolean; // True if purchased 3-month unlimited pass
  history: Array<{
    id: string;
    type: 'free_initial' | 'purchase' | 'contribution';
    amount: number;
    description: string;
    timestamp: string;
  }>;
}

const CREDITS_STORAGE_KEY = 'aura_user_credits_v1';
const CONTRIBUTIONS_STORAGE_KEY = 'aura_contributed_questions_v1';

export function getUserCredits(): UserCreditsState {
  if (typeof window === 'undefined') {
    return {
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
  }

  try {
    const raw = localStorage.getItem(CREDITS_STORAGE_KEY);
    if (!raw) {
      const initial: UserCreditsState = {
        credits: 1,
        contributedCount: 0,
        isUnlimited: false,
        history: [
          {
            id: 'init_' + Date.now(),
            type: 'free_initial',
            amount: 1,
            description: 'Initial Free Assessment Credit',
            timestamp: new Date().toISOString(),
          },
        ],
      };
      localStorage.setItem(CREDITS_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch (e) {
    return {
      credits: 1,
      contributedCount: 0,
      isUnlimited: false,
      history: [],
    };
  }
}

export function saveUserCredits(state: UserCreditsState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CREDITS_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save credits state:', e);
  }
}

export function useOACredit(): { success: boolean; message: string; remainingCredits: number } {
  const state = getUserCredits();

  if (state.isUnlimited) {
    return { success: true, message: '3 Months Unlimited Pass Active', remainingCredits: 999 };
  }

  if (state.credits <= 0) {
    return {
      success: false,
      message: 'You have 0 OA credits remaining. Purchase ₹99 Unlimited Pass or contribute 3 questions to unlock!',
      remainingCredits: 0,
    };
  }

  state.credits -= 1;
  saveUserCredits(state);
  return { success: true, message: '1 Credit Used', remainingCredits: state.credits };
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

export function isQuestionDuplicate(title: string): boolean {
  const normTitle = title.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!normTitle) return false;

  // Check in main questions dataset
  const datasetQuestions = getAllQuestions();
  const foundInDataset = datasetQuestions.some(
    (q) =>
      q.title.trim().toLowerCase().replace(/[^a-z0-9]/g, '') === normTitle ||
      q.taskId.trim().toLowerCase().replace(/[^a-z0-9]/g, '') === normTitle
  );
  if (foundInDataset) return true;

  // Check in previously contributed user questions
  const userContributed = getContributedQuestions();
  const foundInContributed = userContributed.some(
    (q) => q.title.trim().toLowerCase().replace(/[^a-z0-9]/g, '') === normTitle
  );
  return foundInContributed;
}

export function submitQuestionContribution(
  question: Omit<ContributedQuestion, 'id' | 'submittedAt'>
): {
  success: boolean;
  error?: string;
  totalContributed: number;
  creditsEarned: number;
  progressInCurrentTier: number;
} {
  const state = getUserCredits();

  // Duplicate Check
  if (isQuestionDuplicate(question.title)) {
    return {
      success: false,
      error: `The question "${question.title}" already exists in the question bank dataset. Please submit a unique problem.`,
      totalContributed: state.contributedCount,
      creditsEarned: 0,
      progressInCurrentTier: state.contributedCount % 3,
    };
  }

  const existingQuestions = getContributedQuestions();

  const newQuestion: ContributedQuestion = {
    ...question,
    id: 'contrib_' + Math.random().toString(36).substring(2, 9),
    submittedAt: new Date().toISOString(),
  };

  existingQuestions.push(newQuestion);
  if (typeof window !== 'undefined') {
    localStorage.setItem(CONTRIBUTIONS_STORAGE_KEY, JSON.stringify(existingQuestions));
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

  saveUserCredits(state);

  const progressInCurrentTier = state.contributedCount % 3 === 0 ? 3 : state.contributedCount % 3;

  return {
    success: true,
    totalContributed: state.contributedCount,
    creditsEarned,
    progressInCurrentTier,
  };
}
