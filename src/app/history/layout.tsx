import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Assessment History & Performance Reports',
  description:
    'Track and review your past online technical assessments, score breakdowns, and submission history on CodeSprint.',
};

export default function HistoryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
