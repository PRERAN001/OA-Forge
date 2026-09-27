import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserFromDB, updateUserCreditStatusInDB, syncUserWithMongoDB } from '@/lib/dbServices';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const emailParam = request.nextUrl.searchParams.get('email');
    const userEmail = session?.user?.email || emailParam;

    if (!userEmail) {
      return NextResponse.json({ error: 'User email is required' }, { status: 400 });
    }

    // Ensure user document exists in MongoDB
    await syncUserWithMongoDB(
      userEmail,
      session?.user?.name || undefined,
      session?.user?.image || undefined
    );
    const user = await getUserFromDB(userEmail);

    if (!user) {
      return NextResponse.json({
        email: userEmail,
        credits: 1,
        isUnlimited: false,
        contributedCount: 0,
      });
    }

    return NextResponse.json({
      email: user.email,
      credits: user.credits ?? 1,
      isUnlimited: !!user.isUnlimited,
      unlimitedExpiry: user.unlimitedExpiry ? new Date(user.unlimitedExpiry).toISOString() : undefined,
      contributedCount: user.contributedCount ?? 0,
    });
  } catch (error: any) {
    console.error('Error fetching user credits status from DB:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch user credits from DB.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const userEmail = session?.user?.email || body.email;

    if (!userEmail) {
      return NextResponse.json({ error: 'User email is required' }, { status: 400 });
    }

    const updatedUser = await updateUserCreditStatusInDB(userEmail, {
      isUnlimited: body.isUnlimited,
      unlimitedExpiry: body.unlimitedExpiry,
      credits: body.credits,
      contributedCount: body.contributedCount,
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('Error updating user credits in DB:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update user credits in DB.' },
      { status: 500 }
    );
  }
}
