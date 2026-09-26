import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IQuestion extends Document {
  questionId: number;
  taskId: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  points: number;
  tags: string[];
  problemDescription: string;
  starterCode: string;
  entryPoint?: string;
  inputOutput: Array<{ input: string; output: string }>;
  edgeCases?: Array<{ title: string; input: string; output: string; explanation?: string }>;
  isCommunity?: boolean;
  contributedBy?: string;
  createdAt: Date;
}

const QuestionSchema: Schema<IQuestion> = new Schema(
  {
    questionId: { type: Number, required: true, index: true },
    taskId: { type: String, required: true },
    title: { type: String, required: true, index: true },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
    points: { type: Number, default: 100 },
    tags: [{ type: String, index: true }],
    problemDescription: { type: String, required: true },
    starterCode: { type: String, default: '' },
    entryPoint: { type: String },
    inputOutput: [
      {
        input: { type: String },
        output: { type: String },
      },
    ],
    edgeCases: [
      {
        title: { type: String },
        input: { type: String },
        output: { type: String },
        explanation: { type: String },
      },
    ],
    isCommunity: { type: Boolean, default: false },
    contributedBy: { type: String },
  },
  { timestamps: true }
);

const QuestionModel: Model<IQuestion> =
  mongoose.models.Question || mongoose.model<IQuestion>('Question', QuestionSchema);

export default QuestionModel;
