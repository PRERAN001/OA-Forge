'use client';

import { useEffect, useState } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface Props {
  timeLimitMinutes: number;
  startedAt: string;
  onTimeUp?: () => void;
}

export default function Timer({ timeLimitMinutes, startedAt, onTimeUp }: Props) {
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

  useEffect(() => {
    const totalSeconds = timeLimitMinutes * 60;
    const startMs = new Date(startedAt).getTime();

    const updateTimer = () => {
      const nowMs = Date.now();
      const elapsedSeconds = Math.floor((nowMs - startMs) / 1000);
      const remaining = Math.max(0, totalSeconds - elapsedSeconds);

      setSecondsRemaining(remaining);

      if (remaining <= 0 && onTimeUp) {
        onTimeUp();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [timeLimitMinutes, startedAt, onTimeUp]);

  if (secondsRemaining === null) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const isWarning = secondsRemaining <= 300; // < 5 mins remaining
  const isCritical = secondsRemaining <= 60; // < 1 min remaining

  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div
      className={`flex items-center gap-2 rounded-lg border px-3.5 py-1.5 font-mono text-sm font-bold transition shadow-sm ${
        isCritical
          ? 'bg-rose-500/20 text-rose-400 border-rose-500/50 animate-pulse'
          : isWarning
          ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
          : 'bg-zinc-900 text-zinc-200 border-zinc-700/80'
      }`}
    >
      {isWarning ? (
        <AlertTriangle className={`h-4 w-4 ${isCritical ? 'text-rose-400' : 'text-amber-400'}`} />
      ) : (
        <Clock className="h-4 w-4 text-amber-400" />
      )}
      <span className="tracking-wider">{formattedTime}</span>
      <span className="text-[10px] font-sans font-normal text-zinc-400 uppercase tracking-widest hidden sm:inline">
        Left
      </span>
    </div>
  );
}
