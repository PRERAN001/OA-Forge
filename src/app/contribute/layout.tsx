import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contribute Questions & Earn Free OA Credits',
  description:
    'Submit algorithm questions with problem statements, test cases, and edge cases to earn free Online Assessment credits on CodeSprint.',
};

export default function ContributeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
