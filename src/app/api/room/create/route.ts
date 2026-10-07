import { NextRequest, NextResponse } from 'next/server';
import { randomBytes, randomInt } from 'crypto';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import RoomModel from '@/models/RoomModel';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I, O, 0, 1
const MAX_ATTEMPTS = 5;

function generateCode(len = 6) {
  let code = '';
  for (let i = 0; i < len; i++) {
    code += CODE_CHARS[randomInt(CODE_CHARS.length)];
  }
  return code;
}

function generateRoomId() {
  return randomBytes(8).toString('hex');
}

function isDuplicateKeyError(
  error: unknown
): error is { code: number; keyPattern?: Record<string, unknown> } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: unknown }).code === 11000
  );
}

// POST /api/room/create — create a new room
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  let title: unknown;
  try {
    ({ title } = await request.json());
  } catch {
    title = undefined;
  }
  const safeTitle =
    typeof title === 'string' && title.trim()
      ? title.trim().slice(0, 100)
      : 'Competitive OA Room';

  const database = await connectToDatabase();
  if (!database) {
    return NextResponse.json(
      { error: 'Database is unavailable. Please try again shortly.' },
      { status: 503 }
    );
  }

  let room;
  try {
    room = await RoomModel.create({
      roomId: generateRoomId(),
      creatorEmail: session.user.email,
      title: safeTitle,
      members: [
        {
          email: session.user.email,
          name: session.user.name || session.user.email,
          joinedAt: new Date(),
        },
      ],
      status: 'waiting',
    });
  } catch (error) {
    console.error('Room creation failed:', error);
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const inviteCode = generateCode();
    try {
      const result = await RoomModel.updateOne(
        { _id: room._id, inviteCode: { $exists: false } },
        { $set: { inviteCode } }
      );

      if (result.modifiedCount === 1) {
        return NextResponse.json({
          roomId: room.roomId,
          inviteCode,
          title: room.title,
        });
      }
    } catch (error) {
      if (isDuplicateKeyError(error)) continue;
      console.error('Invite code assignment failed:', error);
      break;
    }
  }

  try {
    await RoomModel.deleteOne({ _id: room._id });
  } catch (cleanupError) {
    console.error('Failed to clean up room after invite code assignment failure:', cleanupError);
  }

  return NextResponse.json(
    { error: 'Could not generate a unique invite code. Please try again.' },
    { status: 503 }
  );
}