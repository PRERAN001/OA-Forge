import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Algorithm Question Bank (2,800+ Problems)',
  description:
    'Explore over 2,800 authentic LeetCode-style algorithm interview questions with problem descriptions, test cases, difficulty levels, and topic tags on CodeSprint.',
};

export default function QuestionsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
