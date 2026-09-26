import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planId,
      credits,
    } = await request.json();

    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (key_secret && razorpay_signature) {
      // Verify HMAC SHA256 signature from Razorpay
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', key_secret)
        .update(body.toString())
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        return NextResponse.json(
          { error: 'Payment signature verification failed.' },
          { status: 400 }
        );
      }
    }

    // Return successful verification payload
    return NextResponse.json({
      status: 'success',
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id || `pay_mock_${Date.now()}`,
      planId,
      creditsAdded: credits || 1,
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
