import { NextRequest, NextResponse } from 'next/server';
import { getSessionServer, saveSessionServer } from '@/lib/sessionStore';
import { OASession, Submission } from '@/types/oa';
import { executeOnJudge0 } from '@/lib/judge0';

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

    const code = submission.code || '';
    const lang = submission.language || 'python';
    const testCases = question.inputOutput || [];

    const execResult = await executeOnJudge0(code, question.entryPoint, testCases, lang);

    const testResults = execResult.results || [];
    const passedCount = testResults.filter((r) => r.passed).length;
    const totalTests = testCases.length || 1;
    const scoreFraction = passedCount / totalTests;
    const score = Math.round(question.points * scoreFraction);

    const SAMPLE_LIMIT = 3;
    const sampleResults = testResults.slice(0, SAMPLE_LIMIT);
    const hiddenResults = testResults.slice(SAMPLE_LIMIT);
    const hiddenTotal = hiddenResults.length;
    const hiddenPassed = hiddenResults.filter((r) => r.passed).length;

    const fullSubmission: Submission = {
      code,
      language: submission.language || 'python',
      submittedAt: new Date().toISOString(),
      status: 'submitted',
      score,
      testResults: [
        ...sampleResults.map((r) => ({
          passed: r.passed,
          input: r.input,
          expected: r.expected,
          actual: r.actual,
        })),
        ...hiddenResults.map((r) => ({
          passed: r.passed,
          input: '[Hidden Test Case]',
          expected: '[Hidden Output]',
          actual: r.passed ? '[Passed]' : '[Failed]',
        })),
      ],
    };

    session.submissions[questionId] = fullSubmission;

    session.totalScore = Object.values(session.submissions).reduce(
      (sum, sub) => sum + (sub.score || 0),
      0
    );

    saveSessionServer(session);

    const clientExecution = {
      status: execResult.status,
      runtime: execResult.runtime,
      memory: execResult.memory,
      error: execResult.error,
      results: sampleResults,
      hiddenStats: {
        total: hiddenTotal,
        passed: hiddenPassed,
        allPassed: hiddenPassed === hiddenTotal,
      },
      totalTests,
      totalPassed: passedCount,
    };

    return NextResponse.json({
      message: 'Question submitted successfully',
      submission: fullSubmission,
      execution: clientExecution,
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
