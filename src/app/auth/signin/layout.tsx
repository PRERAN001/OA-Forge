import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In with Google',
  description:
    'Sign in to your RoundZero account using Google to access your assessment credits, history, and active Pro pass.',
};

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
