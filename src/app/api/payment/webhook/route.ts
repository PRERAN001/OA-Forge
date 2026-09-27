import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const bodyText = await request.text();
    const signature = request.headers.get('x-razorpay-signature');
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (webhookSecret && signature) {
      // Verify Razorpay Webhook signature
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(bodyText)
        .digest('hex');

      if (expectedSignature !== signature) {
        console.error('Invalid Razorpay Webhook signature');
        return NextResponse.json(
          { error: 'Invalid webhook signature' },
          { status: 400 }
        );
      }
    }

    const event = JSON.parse(bodyText);

    switch (event.event) {
      case 'payment.captured':
        console.log('Razorpay Payment Captured:', event.payload.payment.entity.id);
        break;

      case 'order.paid':
        console.log('Razorpay Order Paid:', event.payload.order.entity.id);
        break;

      case 'payment.failed':
        console.log('Razorpay Payment Failed:', event.payload.payment.entity.id);
        break;

      default:
        console.log('Unhandled Razorpay event:', event.event);
    }

    return NextResponse.json({ status: 'ok', received: true });
  } catch (error: any) {
    console.error('Error handling Razorpay webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing error' },
      { status: 500 }
    );
  }
}
