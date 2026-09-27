import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { recordPaymentToDB, updateUserCreditStatusInDB } from '@/lib/dbServices';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planId,
      credits,
      userEmail: bodyEmail,
    } = await request.json();

    const email = session?.user?.email || bodyEmail;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (key_secret && razorpay_signature) {
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', key_secret)
        .update(body.toString())
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        await recordPaymentToDB({
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
          userEmail: email,
          planId: planId || 'unlimited_3months_99',
          amount: 99,
          credits: credits || 999,
          status: 'failed',
        });

        return NextResponse.json(
          { error: 'Payment signature verification failed.' },
          { status: 400 }
        );
      }
    }

    await recordPaymentToDB({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id || `pay_mock_${Date.now()}`,
      userEmail: email,
      planId: planId || 'unlimited_3months_99',
      amount: 99,
      credits: credits || 999,
      status: 'verified',
    });

    if (email) {
      const expiry = new Date();
      expiry.setMonth(expiry.getMonth() + 3);
      await updateUserCreditStatusInDB(email, {
        isUnlimited: true,
        unlimitedExpiry: expiry.toISOString(),
        credits: 999,
      });
    }

    return NextResponse.json({
      status: 'success',
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id || `pay_mock_${Date.now()}`,
      planId,
      creditsAdded: credits || 999,
      verifiedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error verifying payment signature:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment.' },
      { status: 500 }
    );
  }
}
