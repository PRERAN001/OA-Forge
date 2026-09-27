import rawQuestions from '@/data/questions.json';
import { Question, Difficulty, DatasetStats, PointsConfig } from '@/types/oa';

const questions: Question[] = rawQuestions as Question[];

export function getAllQuestions(): Question[] {
  return questions;
}

export function getQuestionById(id: number): Question | undefined {
  return questions.find((q) => q.id === id);
}

export function getDatasetStats(): DatasetStats {
  const difficultyCounts: Record<Difficulty, number> = {
    Easy: 0,
    Medium: 0,
    Hard: 0,
  };

  const tagMap: Record<string, number> = {};

  questions.forEach((q) => {
    if (q.difficulty in difficultyCounts) {
      difficultyCounts[q.difficulty]++;
    }
    q.tags.forEach((tag) => {
      tagMap[tag] = (tagMap[tag] || 0) + 1;
    });
  });

  const tagCounts = Object.entries(tagMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalQuestions: questions.length,
    difficultyCounts,
    tagCounts,
  };
}

export interface FilterParams {
  difficulties?: Difficulty[];
  tags?: string[];
  search?: string;
  questionIds?: number[];
  pointsConfig?: PointsConfig;
}

export function filterQuestions(params: FilterParams): Question[] {
  let result = [...questions];

  if (params.difficulties && params.difficulties.length > 0) {
    const diffSet = new Set(params.difficulties);
    result = result.filter((q) => diffSet.has(q.difficulty));
  }

  if (params.tags && params.tags.length > 0) {
    const tagSet = new Set(params.tags.map((t) => t.toLowerCase()));
    result = result.filter((q) =>
      q.tags.some((t) => tagSet.has(t.toLowerCase()))
    );
  }

  if (params.search && params.search.trim() !== '') {
    const term = params.search.toLowerCase().trim();
    result = result.filter(
      (q) =>
        q.title.toLowerCase().includes(term) ||
        q.id.toString() === term ||
        q.tags.some((t) => t.toLowerCase().includes(term))
    );
  }

  if (params.questionIds && params.questionIds.length > 0) {
    const idSet = new Set(params.questionIds);
    result = result.filter((q) => idSet.has(q.id));
  }

  if (params.pointsConfig) {
    const pConfig = params.pointsConfig;
    result = result.map((q) => ({
      ...q,
      points: pConfig[q.difficulty] || q.points,
    }));
  }

  return result;
}

export function getRandomizedQuestions(
  difficulties: Difficulty[],
  tags: string[],
  count: number,
  pointsConfig: PointsConfig
): Question[] {
  const eligible = filterQuestions({ difficulties, tags, pointsConfig });
  if (eligible.length === 0) return [];

  // Shuffle array using Fisher-Yates algorithm
  const shuffled = [...eligible];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, Math.min(count, shuffled.length));
}
