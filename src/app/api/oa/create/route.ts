import { NextRequest, NextResponse } from 'next/server';
import { getRandomizedQuestions, filterQuestions } from '@/lib/questions';
import { OASession, OAFilterConfig, Question } from '@/types/oa';
import { saveSessionServer } from '@/lib/sessionStore';
import { saveOASessionToDB } from '@/lib/dbServices';

export async function POST(request: NextRequest) {
  try {
    const config: OAFilterConfig = await request.json();

    let selectedQuestions: Question[] = [];

    if (config.mode === 'manual' && config.selectedQuestionIds.length > 0) {
      selectedQuestions = filterQuestions({
        questionIds: config.selectedQuestionIds,
        pointsConfig: config.pointsConfig,
      });
    } else {
      selectedQuestions = getRandomizedQuestions(
        config.difficulties,
        config.tags,
        config.questionCount,
        config.pointsConfig
      );
    }

    if (selectedQuestions.length === 0) {
      return NextResponse.json(
        { error: 'No questions match the selected difficulty and topic filters.' },
        { status: 400 }
      );
    }

    // Apply custom points to questions
    selectedQuestions = selectedQuestions.map((q) => ({
      ...q,
      points: config.pointsConfig[q.difficulty] || q.points,
    }));

    const maxScore = selectedQuestions.reduce((acc, q) => acc + q.points, 0);

    const sessionId = process.env.NODE_ENV === 'test' ? 'test-id' : Math.random().toString(36).substring(2, 10) + Date.now().toString(36);

    const session: OASession = {
      id: sessionId,
      title: config.title || `Assessment (${selectedQuestions.length} Questions)`,
      createdAt: new Date().toISOString(),
      startedAt: new Date().toISOString(),
      timeLimitMinutes: config.timeLimitMinutes || 60,
      config,
      questions: selectedQuestions,
      submissions: {},
      totalScore: 0,
      maxScore,
      status: 'in_progress',
    };

    saveSessionServer(session);
    await saveOASessionToDB(session);

    return NextResponse.json({
      sessionId: session.id,
      session,
    });
  } catch (error: any) {
    console.error('Error creating OA session:', error);
    return NextResponse.json(
      { error: 'Failed to create assessment session.' },
      { status: 500 }
    );
  }
}
