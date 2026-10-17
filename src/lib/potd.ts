import pool from '@/lib/db/postgres';
import { Question } from '@/types/oa';
import { mapRowToQuestion, getQuestionByIdFromDB } from '@/lib/questions';
import { connectToDatabase } from '@/lib/mongodb';
import UserModel from '@/models/User';
import POTDSubmissionModel from '@/models/POTDSubmissionModel';
import { normalizeEmail, emailQuery, escapeRegex, syncUserWithMongoDB } from '@/lib/dbServices';

export function getTodayDateStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function getYesterdayDateStr(dateStr = getTodayDateStr()): string {
  const d = new Date(dateStr + 'T00:00:00.000Z');
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().split('T')[0];
}

export function getTimeUntilPOTDReset(): {
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
} {
  const now = new Date();
  const nextReset = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0)
  );
  const diffMs = Math.max(0, nextReset.getTime() - now.getTime());
  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { hours, minutes, seconds, totalSeconds };
}

// Daily in-memory cache for instant 0ms retrieval
let cachedDailyPOTD: { dateStr: string; question: Question } | null = null;
let cachedFullPOTD: { dateStr: string; question: Question } | null = null;
let cachedTotalQuestionCount: number | null = null;

// Stable deterministic hash for picking daily question
function getDailyQuestionIndex(dateStr: string, totalCount: number): number {
  if (totalCount <= 1) return 0;
  let hash = 5381;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) + hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % totalCount;
}

export async function getDailyPOTDQuestion(dateStr = getTodayDateStr()): Promise<{
  question: Question;
  dateStr: string;
} | null> {
  if (cachedDailyPOTD && cachedDailyPOTD.dateStr === dateStr) {
    return cachedDailyPOTD;
  }

  try {
    if (!cachedTotalQuestionCount) {
      const countRes = await pool.query('SELECT COUNT(*) FROM questions');
      cachedTotalQuestionCount = parseInt(countRes.rows[0].count, 10);
    }

    const totalCount = cachedTotalQuestionCount || 100;
    const index = getDailyQuestionIndex(dateStr, totalCount);

    const res = await pool.query(
      'SELECT id, task_id, title, difficulty, points, tags, problem_description, starter_code, entry_point, starter_codes, input_output FROM questions ORDER BY id ASC LIMIT 1 OFFSET $1',
      [index]
    );
    if (res.rows.length === 0) return null;

    const rawQuestion = mapRowToQuestion(res.rows[0]);

    // Sanitize question for client view (expose only sample test cases up to 3)
    const clientQuestion: Question = {
      ...rawQuestion,
      inputOutput: (rawQuestion.inputOutput || []).slice(0, 3),
    };

    cachedDailyPOTD = {
      question: clientQuestion,
      dateStr,
    };

    return cachedDailyPOTD;
  } catch (error) {
    console.error('Error fetching POTD question:', error);
    return null;
  }
}

export async function getFullPOTDQuestion(dateStr = getTodayDateStr()): Promise<Question | null> {
  if (cachedFullPOTD && cachedFullPOTD.dateStr === dateStr) {
    return cachedFullPOTD.question;
  }

  try {
    if (!cachedTotalQuestionCount) {
      const countRes = await pool.query('SELECT COUNT(*) FROM questions');
      cachedTotalQuestionCount = parseInt(countRes.rows[0].count, 10);
    }

    const totalCount = cachedTotalQuestionCount || 100;
    const index = getDailyQuestionIndex(dateStr, totalCount);

    const res = await pool.query(
      'SELECT id, task_id, title, difficulty, points, tags, problem_description, starter_code, entry_point, starter_codes, input_output FROM questions ORDER BY id ASC LIMIT 1 OFFSET $1',
      [index]
    );
    if (res.rows.length === 0) return null;

    const fullQuestion = mapRowToQuestion(res.rows[0]);
    cachedFullPOTD = { dateStr, question: fullQuestion };
    return fullQuestion;
  } catch (error) {
    console.error('Error fetching full POTD question:', error);
    return null;
  }
}

/**
 * Computes consecutive streak cleanly from the chronological history array
 */
export function computeConsecutiveStreak(
  solvedDates: string[] = [],
  referenceDate = getTodayDateStr()
): number {
  if (!solvedDates || solvedDates.length === 0) return 0;

  const dateSet = new Set(solvedDates);
  const isSolvedToday = dateSet.has(referenceDate);
  const yesterday = getYesterdayDateStr(referenceDate);
  const isSolvedYesterday = dateSet.has(yesterday);

  // If neither today nor yesterday was solved, streak is broken
  if (!isSolvedToday && !isSolvedYesterday) {
    return 0;
  }

  // Count backwards consecutively from today (or yesterday if not solved today yet)
  let curr = isSolvedToday ? referenceDate : yesterday;
  let streak = 0;

  while (dateSet.has(curr)) {
    streak++;
    curr = getYesterdayDateStr(curr);
  }

  return streak;
}

export async function getUserPOTDStatus(
  userEmail?: string,
  dateStr = getTodayDateStr()
): Promise<{
  isAuthenticated: boolean;
  streak: number;
  isSolvedToday: boolean;
  lastSolvedDate?: string;
  solvedDates: string[];
  credits: number;
}> {
  if (!userEmail) {
    return {
      isAuthenticated: false,
      streak: 0,
      isSolvedToday: false,
      solvedDates: [],
      credits: 0,
    };
  }

  const normEmail = normalizeEmail(userEmail);
  if (!normEmail) {
    return {
      isAuthenticated: false,
      streak: 0,
      isSolvedToday: false,
      solvedDates: [],
      credits: 0,
    };
  }

  try {
    await connectToDatabase();
    let user = await UserModel.findOne(emailQuery(normEmail));
    if (!user) {
      // Auto-heal / sync user if not found
      user = await syncUserWithMongoDB(normEmail);
    }

    if (!user) {
      return {
        isAuthenticated: true,
        streak: 0,
        isSolvedToday: false,
        solvedDates: [],
        credits: 1,
      };
    }

    const solvedDates = user.potdSolvedDates || [];
    const isSolvedToday = solvedDates.includes(dateStr) || user.potdLastSolvedDate === dateStr;

    // Calculate effective live streak
    let liveStreak = computeConsecutiveStreak(solvedDates, dateStr);
    const yesterday = getYesterdayDateStr(dateStr);

    // If solved today or yesterday, preserve recorded streak if higher
    if (isSolvedToday || user.potdLastSolvedDate === yesterday || solvedDates.includes(yesterday)) {
      liveStreak = Math.max(liveStreak, user.potdStreak || (isSolvedToday ? 1 : 0));
    } else {
      liveStreak = 0;
    }

    return {
      isAuthenticated: true,
      streak: liveStreak,
      isSolvedToday,
      lastSolvedDate: user.potdLastSolvedDate,
      solvedDates,
      credits: user.credits ?? 1,
    };
  } catch (err) {
    console.warn('Error fetching user POTD status:', err);
    return {
      isAuthenticated: true,
      streak: 0,
      isSolvedToday: false,
      solvedDates: [],
      credits: 1,
    };
  }
}

export async function recordPOTDSolve(
  userEmail: string,
  questionId: number,
  code: string,
  language: string,
  runtime?: string | number,
  memory?: string | number,
  dateStr = getTodayDateStr()
): Promise<{
  success: boolean;
  alreadySolved: boolean;
  newStreak: number;
  creditAdded: boolean;
  credits: number;
}> {
  const normEmail = normalizeEmail(userEmail);
  if (!normEmail) {
    return {
      success: false,
      alreadySolved: false,
      newStreak: 0,
      creditAdded: false,
      credits: 0,
    };
  }

  await connectToDatabase();
  let user = await UserModel.findOne(emailQuery(normEmail));
  if (!user) {
    user = await syncUserWithMongoDB(normEmail);
  }

  if (!user) {
    return {
      success: false,
      alreadySolved: false,
      newStreak: 0,
      creditAdded: false,
      credits: 0,
    };
  }

  const yesterday = getYesterdayDateStr(dateStr);
  const solvedDates = user.potdSolvedDates || [];
  const alreadySolved = solvedDates.includes(dateStr) || user.potdLastSolvedDate === dateStr;

  let newStreak = user.potdStreak || 0;
  let creditAdded = false;
  let finalCredits = user.credits ?? 1;

  if (!alreadySolved) {
    if (user.potdLastSolvedDate === yesterday || solvedDates.includes(yesterday)) {
      newStreak = (user.potdStreak || 0) + 1;
    } else {
      newStreak = 1;
    }

    finalCredits = (user.credits ?? 1) + 1;
    creditAdded = true;

    // Persist atomically to MongoDB
    await UserModel.findOneAndUpdate(
      emailQuery(normEmail),
      {
        $set: {
          email: normEmail,
          potdStreak: newStreak,
          potdLastSolvedDate: dateStr,
          credits: finalCredits,
        },
        $addToSet: {
          potdSolvedDates: dateStr,
        },
      },
      { new: true, upsert: true }
    );
  } else {
    newStreak = Math.max(user.potdStreak || 1, computeConsecutiveStreak(solvedDates, dateStr));
  }

  // Record submission log into MongoDB
  try {
    await POTDSubmissionModel.create({
      userEmail: normEmail,
      questionId,
      dateStr,
      code,
      language,
      status: 'passed',
      runtime,
      memory,
      submittedAt: new Date(),
    });
  } catch (err) {
    console.warn('Error saving POTD submission document:', err);
  }

  return {
    success: true,
    alreadySolved,
    newStreak,
    creditAdded,
    credits: finalCredits,
  };
}

export async function getUserPOTDSubmissions(
  userEmail?: string,
  dateStr = getTodayDateStr()
): Promise<Array<{
  output: {
    status: string;
    runtime?: string | number;
    memory?: string | number;
  };
  code: string;
  language: string;
  at: string;
  passed: boolean;
}>> {
  if (!userEmail) return [];
  const normEmail = normalizeEmail(userEmail);
  if (!normEmail) return [];

  try {
    await connectToDatabase();
    const subs = await POTDSubmissionModel.find({
      userEmail: { $regex: new RegExp(`^${escapeRegex(normEmail)}$`, 'i') },
      dateStr,
    })
      .sort({ submittedAt: -1 })
      .limit(20)
      .lean();

    return subs.map((s: any) => ({
      output: {
        status: s.status === 'passed' ? 'Accepted' : 'Wrong Answer',
        runtime: s.runtime,
        memory: s.memory,
      },
      code: s.code,
      language: s.language,
      at: s.submittedAt ? new Date(s.submittedAt).toISOString() : new Date().toISOString(),
      passed: s.status === 'passed',
    }));
  } catch (err) {
    console.warn('Error retrieving user POTD submissions:', err);
    return [];
  }
}

export async function getUserLatestPOTDCode(
  userEmail?: string,
  dateStr = getTodayDateStr()
): Promise<{ code: string; language: string } | null> {
  if (!userEmail) return null;
  const normEmail = normalizeEmail(userEmail);
  if (!normEmail) return null;

  try {
    await connectToDatabase();
    const lastSub = await POTDSubmissionModel.findOne({
      userEmail: { $regex: new RegExp(`^${escapeRegex(normEmail)}$`, 'i') },
      dateStr,
    })
      .sort({ submittedAt: -1 })
      .lean();

    if (lastSub) {
      return {
        code: (lastSub as any).code,
        language: (lastSub as any).language || 'python',
      };
    }
    return null;
  } catch (err) {
    console.warn('Error retrieving latest POTD code:', err);
    return null;
  }
}
