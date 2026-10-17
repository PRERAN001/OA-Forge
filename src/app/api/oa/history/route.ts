import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserOASessionsFromDB } from '@/lib/dbServices';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ sessions: [] });
    }

    const sessions = await getUserOASessionsFromDB(session.user.email);
    return NextResponse.json({ sessions });
  } catch (error: any) {
    console.error('Error fetching OA history:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve assessment history' },
      { status: 500 }
    );
  }
}
