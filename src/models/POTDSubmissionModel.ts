import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPOTDSubmission extends Document {
  userEmail: string;
  questionId: number;
  dateStr: string; // YYYY-MM-DD
  code: string;
  language: string;
  status: 'passed' | 'failed';
  runtime?: string | number;
  memory?: string | number;
  submittedAt: Date;
}

const POTDSubmissionSchema: Schema<IPOTDSubmission> = new Schema(
  {
    userEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    questionId: { type: Number, required: true, index: true },
    dateStr: { type: String, required: true, index: true },
    code: { type: String, required: true },
    language: { type: String, default: 'python' },
    status: { type: String, enum: ['passed', 'failed'], required: true },
    runtime: { type: Schema.Types.Mixed },
    memory: { type: Schema.Types.Mixed },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

POTDSubmissionSchema.index({ userEmail: 1, dateStr: 1 });

const POTDSubmissionModel: Model<IPOTDSubmission> =
  mongoose.models.POTDSubmission || mongoose.model<IPOTDSubmission>('POTDSubmission', POTDSubmissionSchema);

export default POTDSubmissionModel;
