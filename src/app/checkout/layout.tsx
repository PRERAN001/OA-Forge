import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Secure Checkout | Razorpay Gateway',
  description:
    'Complete your ₹99 3-Month Unlimited Pro Pass purchase securely via Razorpay on CodeSprint.',
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
