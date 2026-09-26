import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { recordPaymentToDB } from '@/lib/dbServices';

export async function POST(request: NextRequest) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planId,
      credits,
      userEmail,
    } = await request.json();

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
          userEmail,
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
      userEmail,
      planId: planId || 'unlimited_3months_99',
      amount: 99,
      credits: credits || 999,
      status: 'verified',
    });

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
