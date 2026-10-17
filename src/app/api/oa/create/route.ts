import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getRandomizedQuestionsFromDB, filterQuestionsFromDB } from '@/lib/questions';
import { OASession, OAFilterConfig, Question } from '@/types/oa';
import { saveSessionServer } from '@/lib/sessionStore';
import { saveOASessionToDB, getUserFromDB, updateUserCreditStatusInDB, syncUserWithMongoDB } from '@/lib/dbServices';
import PaymentModel from '@/models/PaymentModel';

export async function POST(request: NextRequest) {
  try {
    const authSession = await getServerSession(authOptions);

    if (authSession?.user?.email) {
      const email = authSession.user.email;
      let user = await getUserFromDB(email);
      if (!user) {
        user = await syncUserWithMongoDB(email, authSession.user.name || undefined);
      }

      let hasUnlimited = !!(user?.isUnlimited && (!user.unlimitedExpiry || new Date(user.unlimitedExpiry).getTime() > Date.now()));

      if (!hasUnlimited) {
        try {
          const verifiedPayment = await PaymentModel.findOne({
            userEmail: email,
            status: 'verified',
            $or: [{ planId: /unlimited/ }, { credits: { $gte: 900 } }],
          }).sort({ createdAt: -1 });

          if (verifiedPayment) {
            const purchaseDate = new Date(verifiedPayment.createdAt);
            const expiry = new Date(purchaseDate);
            expiry.setMonth(expiry.getMonth() + 3);
            if (expiry.getTime() > Date.now()) {
              hasUnlimited = true;
              await updateUserCreditStatusInDB(email, {
                isUnlimited: true,
                unlimitedExpiry: expiry.toISOString(),
                credits: 999,
              });
              user = await getUserFromDB(email);
            }
          }
        } catch (err) {
          console.warn('Payment check warning in oa create route:', err);
        }
      }

      if (user && !hasUnlimited && (user.credits ?? 1) <= 0) {
        return NextResponse.json(
          { error: 'You have 0 OA credits remaining. Purchase ₹99 Unlimited Pass or contribute 3 questions to unlock!' },
          { status: 402 }
        );
      }

      // Deduct 1 credit from user account if not unlimited
      if (user && !hasUnlimited) {
        await updateUserCreditStatusInDB(email, {
          credits: Math.max(0, (user.credits ?? 1) - 1),
        });
      }
    }

    const config: OAFilterConfig = await request.json();

    let selectedQuestions: Question[] = [];

    if (config.mode === 'manual' && config.selectedQuestionIds.length > 0) {
      selectedQuestions = await filterQuestionsFromDB({
        questionIds: config.selectedQuestionIds,
        pointsConfig: config.pointsConfig,
      });
    } else {
      selectedQuestions = await getRandomizedQuestionsFromDB(
        config.difficulties,
        config.tags,
        config.questionCount,
        config.pointsConfig
      );
    }

    if (selectedQuestions.length === 0) {
      return NextResponse.json(
        { error: 'No questions match the selected difficulty and topic filters.' },
        { status: 400 }
      );
    }

    // Apply custom points to questions
    selectedQuestions = selectedQuestions.map((q) => ({
      ...q,
      points: config.pointsConfig ? config.pointsConfig[q.difficulty] || q.points : q.points,
    }));

    const maxScore = selectedQuestions.reduce((acc, q) => acc + q.points, 0);

    const sessionId =
      process.env.NODE_ENV === 'test'
        ? 'test-id'
        : Math.random().toString(36).substring(2, 10) + Date.now().toString(36);

    const session: OASession = {
      id: sessionId,
      title: config.title || `Assessment (${selectedQuestions.length} Questions)`,
      createdAt: new Date().toISOString(),
      startedAt: new Date().toISOString(),
      timeLimitMinutes: config.timeLimitMinutes || 60,
      config,
      questions: selectedQuestions,
      submissions: {},
      totalScore: 0,
      maxScore,
      status: 'in_progress',
    };

    saveSessionServer(session);
    await saveOASessionToDB(session);

    return NextResponse.json({
      sessionId: session.id,
      session,
    });
  } catch (error: any) {
    console.error('Error creating OA session:', error);
    return NextResponse.json(
      { error: 'Failed to create assessment session.' },
      { status: 500 }
    );
  }
}
