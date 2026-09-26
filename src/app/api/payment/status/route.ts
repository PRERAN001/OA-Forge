import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get('orderId');
    const paymentId = searchParams.get('paymentId');

    const key_id = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      // Mock status check when live keys are not provided yet
      return NextResponse.json({
        status: 'captured',
        orderId: orderId || 'order_mock_123',
        paymentId: paymentId || 'pay_mock_456',
        amount: 100, // in paise
        currency: 'INR',
        method: 'upi',
        isTestMode: true,
        message: 'Payment verified (Mock Mode). Add RAZORPAY_KEY_SECRET to enable live Razorpay API calls.',
      });
    }

    const instance = new Razorpay({
      key_id,
      key_secret,
    });

    if (paymentId) {
      // Fetch status directly from Razorpay Payments API
      const payment = await instance.payments.fetch(paymentId);
      return NextResponse.json({
        status: payment.status, // 'captured', 'authorized', 'failed', 'refunded'
        paymentId: payment.id,
        orderId: payment.order_id,
        amount: payment.amount,
        currency: payment.currency,
        method: payment.method,
        email: payment.email,
        contact: payment.contact,
        createdAt: payment.created_at,
        isTestMode: false,
      });
    }

    if (orderId) {
      // Fetch status directly from Razorpay Orders API
      const order = await instance.orders.fetch(orderId);
      return NextResponse.json({
        status: order.status, // 'created', 'attempted', 'paid'
        orderId: order.id,
        amount: order.amount,
        amountPaid: order.amount_paid,
        amountDue: order.amount_due,
        currency: order.currency,
        attempts: order.attempts,
        createdAt: order.created_at,
        isTestMode: false,
      });
    }

    return NextResponse.json(
      { error: 'Please provide either orderId or paymentId query parameter.' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error fetching Razorpay payment status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check payment status with Razorpay API.' },
      { status: 500 }
    );
  }
}
