import { Difficulty } from '@/types/oa';

interface Props {
  difficulty: Difficulty;
  points?: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function DifficultyBadge({ difficulty, points, size = 'md' }: Props) {
  const styles = {
    Easy: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    Medium: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    Hard: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  }[difficulty];

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5 font-semibold',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-mono font-medium ${styles} ${sizeClasses}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          difficulty === 'Easy'
            ? 'bg-emerald-400'
            : difficulty === 'Medium'
            ? 'bg-amber-400'
            : 'bg-rose-400'
        }`}
      />
      {difficulty}
      {points !== undefined && (
        <span className="opacity-75 text-[10px] ml-0.5">({points} pts)</span>
      )}
    </span>
  );
}
