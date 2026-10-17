import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getTodayDateStr,
  getTimeUntilPOTDReset,
  getDailyPOTDQuestion,
  getUserPOTDStatus,
  getUserPOTDSubmissions,
  getUserLatestPOTDCode,
} from '@/lib/potd';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const dateStr = getTodayDateStr();

    const userEmail = session?.user?.email || undefined;

    const [potdData, userStatus, submissions, latestCode] = await Promise.all([
      getDailyPOTDQuestion(dateStr),
      getUserPOTDStatus(userEmail, dateStr),
      getUserPOTDSubmissions(userEmail, dateStr),
      getUserLatestPOTDCode(userEmail, dateStr),
    ]);

    if (!potdData || !potdData.question) {
      return NextResponse.json(
        { error: 'No Problem of the Day available for today.' },
        { status: 404 }
      );
    }

    const timeUntilReset = getTimeUntilPOTDReset();

    // Compute recent 7 days calendar for streak visualization
    const calendar: Array<{ dateStr: string; dayName: string; isSolved: boolean; isToday: boolean }> = [];
    const today = new Date(dateStr + 'T00:00:00.000Z');
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setUTCDate(today.getUTCDate() - i);
      const curDateStr = d.toISOString().split('T')[0];
      calendar.push({
        dateStr: curDateStr,
        dayName: dayNames[d.getUTCDay()],
        isSolved: userStatus.solvedDates.includes(curDateStr),
        isToday: curDateStr === dateStr,
      });
    }

    return NextResponse.json({
      dateStr,
      timeUntilReset,
      question: potdData.question,
      userStatus,
      submissions,
      latestCode,
      calendar,
    });
  } catch (error: any) {
    console.error('Error in GET /api/potd:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve Problem of the Day.' },
      { status: 500 }
    );
  }
}
