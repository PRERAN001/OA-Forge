import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function POST(request: NextRequest) {
  try {
    const { planId, amount, currency = 'INR', credits } = await request.json();

    const key_id = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (key_id && key_secret) {
      // Live Razorpay Instance
      const instance = new Razorpay({
        key_id,
        key_secret,
      });

      const order = await instance.orders.create({
        amount: Math.round(amount * 100), // Amount in paise
        currency,
        receipt: `receipt_${Date.now()}`,
        notes: {
          planId,
          credits: credits ? credits.toString() : '1',
        },
      });

      return NextResponse.json({
        id: order.id,
        currency: order.currency,
        amount: order.amount,
        keyId: key_id,
        isTest: false,
      });
    }

    // Fallback Mock Order ID for demonstration & onboarding readiness before user adds API keys
    const mockOrder = {
      id: `order_mock_${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36)}`,
      currency: currency || 'INR',
      amount: Math.round(amount * 100),
      keyId: key_id || 'rzp_test_placeholder_key',
      isTest: true,
      notes: { planId, credits },
    };

    return NextResponse.json(mockOrder);
  } catch (error: any) {
    console.error('Error creating Razorpay order:', error);
    return NextResponse.json(
      { error: 'Failed to create payment order.' },
      { status: 500 }
    );
  }
}
