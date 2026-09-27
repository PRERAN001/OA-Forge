import { NextRequest, NextResponse } from 'next/server';
import { getDatasetStats, filterQuestions, getRandomizedQuestions } from '@/lib/questions';
import { Difficulty } from '@/types/oa';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const mode = searchParams.get('mode');
  if (mode === 'stats') {
    const stats = getDatasetStats();
    return NextResponse.json(stats);
  }

  const difficultiesRaw = searchParams.get('difficulties');
  const tagsRaw = searchParams.get('tags');
  const search = searchParams.get('search') || '';
  const countStr = searchParams.get('count');
  const randomize = searchParams.get('randomize') === 'true';

  const difficulties = difficultiesRaw
    ? (difficultiesRaw.split(',').filter(Boolean) as Difficulty[])
    : [];
  const tags = tagsRaw ? tagsRaw.split(',').filter(Boolean) : [];
  const count = countStr ? parseInt(countStr, 10) : 20;

  if (randomize) {
    const pointsConfig = {
      Easy: parseInt(searchParams.get('easyPoints') || '100', 10),
      Medium: parseInt(searchParams.get('mediumPoints') || '200', 10),
      Hard: parseInt(searchParams.get('hardPoints') || '400', 10),
    };

    const randomized = getRandomizedQuestions(difficulties, tags, count, pointsConfig);
    return NextResponse.json({ questions: randomized, totalMatches: randomized.length });
  }

  const filtered = filterQuestions({
    difficulties,
    tags,
    search,
  });

  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
  const startIndex = (page - 1) * pageSize;
  const paginated = filtered.slice(startIndex, startIndex + pageSize);

  return NextResponse.json({
    questions: paginated,
    totalMatches: filtered.length,
    page,
    totalPages: Math.ceil(filtered.length / pageSize),
  });
}
