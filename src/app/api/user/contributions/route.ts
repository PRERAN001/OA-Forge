import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserContributedQuestionsFromDB } from '@/lib/dbServices';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ questions: [] });
    }
    const questions = await getUserContributedQuestionsFromDB(session.user.email);
    return NextResponse.json({ questions });
  } catch (err: any) {
    console.error('Error fetching contributed questions:', err);
    return NextResponse.json({ questions: [] });
  }
}
