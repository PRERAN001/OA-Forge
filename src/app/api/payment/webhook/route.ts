import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import PaymentModel from '@/models/PaymentModel';
import { updateUserCreditStatusInDB, normalizeEmail } from '@/lib/dbServices';

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
      case 'order.paid': {
        const orderEntity = event.payload?.order?.entity;
        const paymentEntity = event.payload?.payment?.entity;
        const orderId = orderEntity?.id || paymentEntity?.order_id;
        const paymentId = paymentEntity?.id;

        if (orderId) {
          const payment = await PaymentModel.findOne({ orderId });
          if (payment && payment.userEmail) {
            payment.status = 'verified';
            if (paymentId) payment.paymentId = paymentId;
            await payment.save();

            const normEmail = normalizeEmail(payment.userEmail);
            if (normEmail) {
              const expiry = new Date();
              expiry.setMonth(expiry.getMonth() + 3);
              await updateUserCreditStatusInDB(normEmail, {
                isUnlimited: true,
                unlimitedExpiry: expiry.toISOString(),
                credits: 999,
              });
            }
          }
        }
        break;
      }

      case 'payment.failed':
        console.log('Razorpay Payment Failed:', event.payload?.payment?.entity?.id);
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
