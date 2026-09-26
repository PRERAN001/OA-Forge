import { connectToDatabase } from './mongodb';
import UserModel from '@/models/User';
import QuestionModel from '@/models/QuestionModel';
import OASessionModel from '@/models/OASessionModel';
import PaymentModel from '@/models/PaymentModel';
import { OASession } from '@/types/oa';

export async function syncUserWithMongoDB(email: string, name?: string, image?: string) {
  try {
    const conn = await connectToDatabase();
    if (!conn) return null;

    let user = await UserModel.findOne({ email });
    if (!user) {
      user = await UserModel.create({
        email,
        name: name || 'User',
        image: image || '',
        credits: 1,
        isUnlimited: false,
        contributedCount: 0,
      });
      console.log('Created new MongoDB User:', email);
    }
    return user;
  } catch (err) {
    console.warn('MongoDB User sync warning:', err);
    return null;
  }
}

export async function saveOASessionToDB(session: OASession, userEmail?: string) {
  try {
    const conn = await connectToDatabase();
    if (!conn) return null;

    const doc = await OASessionModel.findOneAndUpdate(
      { sessionId: session.id },
      {
        sessionId: session.id,
        userEmail: userEmail || '',
        title: session.title,
        timeLimitMinutes: session.timeLimitMinutes,
        config: session.config,
        questions: session.questions,
        submissions: session.submissions,
        totalScore: session.totalScore,
        maxScore: session.maxScore,
        status: session.status,
        startedAt: new Date(session.startedAt),
        completedAt: session.completedAt ? new Date(session.completedAt) : undefined,
      },
      { upsert: true, new: true }
    );
    return doc;
  } catch (err) {
    console.warn('MongoDB OA Session save warning:', err);
    return null;
  }
}

export async function getOASessionFromDB(sessionId: string) {
  try {
    const conn = await connectToDatabase();
    if (!conn) return null;

    const doc = await OASessionModel.findOne({ sessionId });
    if (!doc) return null;

    return {
      id: doc.sessionId,
      title: doc.title,
      createdAt: doc.createdAt ? doc.createdAt.toISOString() : new Date().toISOString(),
      startedAt: doc.startedAt ? doc.startedAt.toISOString() : new Date().toISOString(),
      completedAt: doc.completedAt ? doc.completedAt.toISOString() : undefined,
      timeLimitMinutes: doc.timeLimitMinutes,
      config: doc.config,
      questions: doc.questions,
      submissions: doc.submissions || {},
      totalScore: doc.totalScore,
      maxScore: doc.maxScore,
      status: doc.status,
    } as OASession;
  } catch (err) {
    console.warn('MongoDB OA Session fetch warning:', err);
    return null;
  }
}

export async function recordPaymentToDB(data: {
  orderId: string;
  paymentId?: string;
  userEmail?: string;
  planId: string;
  amount: number;
  credits: number;
  status: 'created' | 'verified' | 'failed';
}) {
  try {
    const conn = await connectToDatabase();
    if (!conn) return null;

    const payment = await PaymentModel.findOneAndUpdate(
      { orderId: data.orderId },
      data,
      { upsert: true, new: true }
    );
    return payment;
  } catch (err) {
    console.warn('MongoDB Payment record warning:', err);
    return null;
  }
}

export async function saveContributedQuestionToDB(question: {
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  problemDescription: string;
  testCases: Array<{ input: string; output: string }>;
  edgeCases: Array<{ title: string; input: string; output: string; explanation?: string }>;
  starterCode?: string;
  contributedBy?: string;
}) {
  try {
    const conn = await connectToDatabase();
    if (!conn) return null;

    const maxQ = await QuestionModel.findOne().sort({ questionId: -1 });
    const nextId = (maxQ?.questionId || 3000) + 1;

    const qDoc = await QuestionModel.create({
      questionId: nextId,
      taskId: question.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      title: question.title,
      difficulty: question.difficulty,
      points: question.difficulty === 'Easy' ? 100 : question.difficulty === 'Medium' ? 200 : 400,
      tags: question.tags,
      problemDescription: question.problemDescription,
      starterCode: question.starterCode || '',
      inputOutput: question.testCases,
      edgeCases: question.edgeCases,
      isCommunity: true,
      contributedBy: question.contributedBy || 'Anonymous',
    });

    return qDoc;
  } catch (err) {
    console.warn('MongoDB Question save warning:', err);
    return null;
  }
}
