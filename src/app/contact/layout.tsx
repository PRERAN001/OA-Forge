import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Support & Inquiries',
  description:
    'Get support for billing, Razorpay payments, question contributions, or technical feedback from the CodeSprint team.',
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
