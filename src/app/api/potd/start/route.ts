import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getFullPOTDQuestion, getTodayDateStr } from '@/lib/potd';
import { OASession } from '@/types/oa';
import { saveSessionServer } from '@/lib/sessionStore';
import { saveOASessionToDB } from '@/lib/dbServices';

export async function POST(request: NextRequest) {
  try {
    const authSession = await getServerSession(authOptions);
    const dateStr = getTodayDateStr();

    const question = await getFullPOTDQuestion(dateStr);
    if (!question) {
      return NextResponse.json(
        { error: 'Today\'s Problem of the Day could not be loaded.' },
        { status: 404 }
      );
    }

    const email = authSession?.user?.email?.toLowerCase().trim();
    const userHash = email
      ? Buffer.from(email).toString('hex').slice(0, 8)
      : Math.random().toString(36).substring(2, 8);

    const sessionId = `potd-${dateStr}-${userHash}`;

    const session: OASession = {
      id: sessionId,
      title: `POTD (${dateStr}): ${question.title}`,
      createdAt: new Date().toISOString(),
      startedAt: new Date().toISOString(),
      timeLimitMinutes: 60,
      userEmail: email,
      config: {
        mode: 'manual',
        difficulties: [question.difficulty],
        tags: question.tags,
        questionCount: 1,
        selectedQuestionIds: [question.id],
        timeLimitMinutes: 60,
        pointsConfig: {
          Easy: 100,
          Medium: 200,
          Hard: 400,
        },
        title: `POTD: ${question.title}`,
        isPOTD: true,
      },
      questions: [question],
      submissions: {},
      totalScore: 0,
      maxScore: question.points || 100,
      status: 'in_progress',
    };

    saveSessionServer(session);
    await saveOASessionToDB(session, email);

    // Provide client-safe questions (only sample test cases up to 3)
    const clientSafeQuestions = [
      {
        ...question,
        inputOutput: (question.inputOutput || []).slice(0, 3),
      },
    ];

    const clientSession: OASession = {
      ...session,
      questions: clientSafeQuestions,
    };

    return NextResponse.json({
      sessionId: session.id,
      session: clientSession,
    });
  } catch (error: any) {
    console.error('Error starting POTD session:', error);
    return NextResponse.json(
      { error: 'Failed to start POTD session.' },
      { status: 500 }
    );
  }
}
