import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import RoomModel from '@/models/RoomModel';

// POST /api/room/join — join an existing room via invite code
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { inviteCode } = await request.json();
  if (!inviteCode) {
    return NextResponse.json({ error: 'Invite code is required' }, { status: 400 });
  }

  await connectToDatabase();

  const room = await RoomModel.findOne({ inviteCode: inviteCode.toUpperCase().trim() });
  if (!room) {
    return NextResponse.json({ error: 'Invalid invite code. Room not found.' }, { status: 404 });
  }

  if (room.status !== 'waiting') {
    return NextResponse.json(
      { error: 'This room has already started or completed. You cannot join now.' },
      { status: 400 }
    );
  }

  // Check if already a member
  const alreadyMember = room.members.some((m) => m.email === session.user!.email);
  if (!alreadyMember) {
    room.members.push({
      email: session.user.email!,
      name: session.user.name || session.user.email!,
      joinedAt: new Date(),
    });
    await room.save();
  }

  return NextResponse.json({ roomId: room.roomId });
}
