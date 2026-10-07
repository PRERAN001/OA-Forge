import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRoomMember {
  email: string;
  name?: string;
  joinedAt: Date;
  sessionId?: string; // their personal OA session once started
}

export interface IRoom extends Document {
  roomId: string;
  inviteCode: string;
  creatorEmail: string;
  title: string;
  members: IRoomMember[];
  oaConfig?: any; // OAFilterConfig, set once creator locks in settings
  status: 'waiting' | 'active' | 'completed';
  createdAt: Date;
  startedAt?: Date;
}

const RoomMemberSchema = new Schema<IRoomMember>(
  {
    email: { type: String, required: true },
    name: { type: String },
    joinedAt: { type: Date, default: Date.now },
    sessionId: { type: String },
  },
  { _id: false }
);

const RoomSchema: Schema<IRoom> = new Schema(
  {
    roomId: { type: String, required: true, unique: true, index: true },
    inviteCode: { type: String, unique: true, sparse: true, index: true, uppercase: true, trim: true },
    creatorEmail: { type: String, required: true, index: true },
    title: { type: String, required: true },
    members: [RoomMemberSchema],
    oaConfig: { type: Schema.Types.Mixed },
    status: {
      type: String,
      enum: ['waiting', 'active', 'completed'],
      default: 'waiting',
    },
    startedAt: { type: Date },
  },
  { timestamps: true }
);

const RoomModel: Model<IRoom> =
  mongoose.models.Room || mongoose.model<IRoom>('Room', RoomSchema);

export default RoomModel;
