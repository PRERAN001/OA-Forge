import { NextRequest, NextResponse } from 'next/server';
import { getSessionServer, saveSessionServer } from '@/lib/sessionStore';
import { OASession, Submission } from '@/types/oa';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const session = getSessionServer(sessionId);

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  return NextResponse.json(session);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const body = await request.json();
  const { action, questionId, submission, finishAssessment } = body;

  let session = getSessionServer(sessionId);

  if (!session) {
    // If not in server memory, client can send session payload to sync
    if (body.sessionData) {
      session = body.sessionData as OASession;
    } else {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
  }

  if (action === 'submit_question') {
    const question = session.questions.find((q) => q.id === questionId);
    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 400 });
    }

    // Mock evaluation of code: if code is non-empty and has structure, simulate sample test passes
    const code = submission.code || '';
    const hasCode = code.trim().length > 15;
    
    // Evaluate sample input/output test cases
    const testResults = (question.inputOutput || []).map((io) => {
      // Mock test pass: if user wrote valid code block
      const passed = hasCode && !code.includes('raise NotImplementedError') && !code.includes('pass');
      return {
        passed,
        input: io.input,
        expected: io.output,
        actual: passed ? io.output : 'Null / Output mismatch',
      };
    });

    const passedCount = testResults.filter((r) => r.passed).length;
    const totalTests = testResults.length || 1;
    const scoreFraction = passedCount / totalTests;
    const score = Math.round(question.points * scoreFraction);

    const fullSubmission: Submission = {
      code,
      language: submission.language || 'python',
      submittedAt: new Date().toISOString(),
      status: 'submitted',
      score,
      testResults,
    };

    session.submissions[questionId] = fullSubmission;

    // Recalculate total score
    session.totalScore = Object.values(session.submissions).reduce(
      (sum, sub) => sum + (sub.score || 0),
      0
    );

    saveSessionServer(session);

    return NextResponse.json({
      message: 'Question submitted successfully',
      submission: fullSubmission,
      session,
    });
  }

  if (finishAssessment) {
    session.status = 'completed';
    session.completedAt = new Date().toISOString();
    
    // Calculate final score across all questions
    session.totalScore = Object.values(session.submissions).reduce(
      (sum, sub) => sum + (sub.score || 0),
      0
    );

    saveSessionServer(session);

    return NextResponse.json({
      message: 'Assessment completed successfully',
      session,
    });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
