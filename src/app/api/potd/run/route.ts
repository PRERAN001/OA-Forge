import { NextRequest, NextResponse } from 'next/server';
import { getQuestionByIdFromDB } from '@/lib/questions';
import { executeOnJudge0 } from '@/lib/judge0';

export async function POST(request: NextRequest) {
  try {
    const { questionId, code, language = 'python' } = await request.json();

    if (!questionId || !code) {
      return NextResponse.json(
        { error: 'Question ID and code are required.' },
        { status: 400 }
      );
    }

    const question = await getQuestionByIdFromDB(Number(questionId));
    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Run only the visible sample test cases for quick feedback
    const sampleCases = (question.inputOutput || []).slice(0, 3);
    const execution = await executeOnJudge0(code, question.entryPoint, sampleCases, language);

    return NextResponse.json(execution);
  } catch (error: any) {
    console.error('Error in POST /api/potd/run:', error);
    return NextResponse.json(
      { error: error?.message || 'Execution error' },
      { status: 500 }
    );
  }
}
