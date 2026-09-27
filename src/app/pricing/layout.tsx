import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing & 3-Month Unlimited Pro Pass',
  description:
    'Unlock 3 months of unlimited technical online assessment creation for just ₹99 with instant Razorpay payment activation on CodeSprint.',
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
