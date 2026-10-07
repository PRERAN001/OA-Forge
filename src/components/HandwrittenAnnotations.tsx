'use client';

import React from 'react';

// Hand-drawn SVG Underline Component
export function DrawnUnderline({
  children,
  className = '',
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={`relative inline-block ${className}`}>
      <span className="relative z-10">{children}</span>
      <svg
        className="absolute left-0 -bottom-1.5 w-full h-3 overflow-visible text-white pointer-events-none"
        viewBox="0 0 100 20"
        preserveAspectRatio="none"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      >
        <path d="M 2 12 Q 25 4, 50 14 T 98 8 Q 80 16, 40 10" />
      </svg>
    </span>
  );
}

// Hand-drawn SVG Circle Component
export function DrawnCircle({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={`relative inline-block p-1.5 ${className}`}>
      <span className="relative z-10">{children}</span>
      <svg
        className="absolute -inset-1.5 w-[calc(100%+12px)] h-[calc(100%+12px)] overflow-visible text-white pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path d="M 10 20 C 30 5, 80 8, 92 30 C 104 55, 85 90, 50 92 C 15 94, 4 70, 8 40 C 12 15, 45 6, 88 18" />
      </svg>
    </span>
  );
}

// Hand-drawn SVG Arrow Component
export function DrawnArrow({
  direction = 'down',
  className = '',
}: {
  direction?: 'down' | 'right' | 'left' | 'up';
  className?: string;
}) {
  if (direction === 'right') {
    return (
      <svg
        className={`inline-block w-6 h-4 text-white overflow-visible ${className}`}
        viewBox="0 0 40 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      >
        <path d="M 2 10 Q 18 6, 32 10 M 24 3 Q 32 8, 38 10 Q 32 14, 25 18" />
      </svg>
    );
  }

  if (direction === 'left') {
    return (
      <svg
        className={`inline-block w-6 h-4 text-white overflow-visible ${className}`}
        viewBox="0 0 40 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      >
        <path d="M 38 10 Q 22 6, 8 10 M 16 3 Q 8 8, 2 10 Q 8 14, 15 18" />
      </svg>
    );
  }

  if (direction === 'up') {
    return (
      <svg
        className={`inline-block w-4 h-6 text-white overflow-visible ${className}`}
        viewBox="0 0 20 40"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      >
        <path d="M 10 38 Q 6 22, 10 8 M 3 16 Q 8 8, 10 2 Q 14 8, 18 15" />
      </svg>
    );
  }

  // Down
  return (
    <svg
      className={`inline-block w-4 h-6 text-white overflow-visible ${className}`}
      viewBox="0 0 20 40"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    >
      <path d="M 10 2 Q 6 18, 10 32 M 3 24 Q 8 32, 10 38 Q 14 32, 18 25" />
    </svg>
  );
}

// Hand-drawn Callout Annotation Component
export function HandwrittenAnnotation({
  text,
  arrow = 'none',
  className = '',
  rotate = '-2deg',
}: {
  text: string;
  arrow?: 'down' | 'right' | 'left' | 'up' | 'none';
  className?: string;
  rotate?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-handwriting text-zinc-300 text-sm tracking-wide select-none pointer-events-none ${className}`}
      style={{ transform: `rotate(${rotate})` }}
    >
      {arrow === 'left' && <DrawnArrow direction="left" className="text-zinc-400" />}
      {arrow === 'up' && <DrawnArrow direction="up" className="text-zinc-400" />}
      <span>{text}</span>
      {arrow === 'right' && <DrawnArrow direction="right" className="text-zinc-400" />}
      {arrow === 'down' && <DrawnArrow direction="down" className="text-zinc-400" />}
    </span>
  );
}

// Technical Label / Badge Component
export function TechnicalLabel({
  text,
  variant = 'default',
  className = '',
}: {
  text: string;
  variant?: 'default' | 'outline' | 'inverted' | 'muted';
  className?: string;
}) {
  const baseClasses =
    'inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-mono font-bold uppercase tracking-wider border rounded-none';
  const variantClasses = {
    default: 'bg-zinc-900 text-zinc-200 border-zinc-700',
    outline: 'bg-black text-white border-zinc-600',
    inverted: 'bg-white text-black border-white',
    muted: 'bg-zinc-950 text-zinc-500 border-zinc-800',
  }[variant];

  return <span className={`${baseClasses} ${variantClasses} ${className}`}>[{text}]</span>;
}

// Brutalist Card Component
export function BrutalistCard({
  children,
  className = '',
  hoverInvert = false,
  cornerMarks = true,
}: {
  children: React.ReactNode;
  className?: string;
  hoverInvert?: boolean;
  cornerMarks?: boolean;
}) {
  return (
    <div
      className={`relative border border-zinc-800 bg-black/90 p-5 transition-all duration-150 rounded-none ${
        hoverInvert ? 'hover:border-white hover:bg-zinc-950' : ''
      } ${className}`}
    >
      {cornerMarks && (
        <>
          <span className="absolute -top-1 -left-1 text-[10px] font-mono text-zinc-700 select-none">+</span>
          <span className="absolute -top-1 -right-1 text-[10px] font-mono text-zinc-700 select-none">+</span>
          <span className="absolute -bottom-1 -left-1 text-[10px] font-mono text-zinc-700 select-none">+</span>
          <span className="absolute -bottom-1 -right-1 text-[10px] font-mono text-zinc-700 select-none">+</span>
        </>
      )}
      {children}
    </div>
  );
}

// Technical Button Component
export function TechnicalButton({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  className = '',
  type = 'button',
}: {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}) {
  const base =
    'relative inline-flex items-center justify-center gap-2 px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider transition-all duration-150 border active:translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed select-none rounded-none';

  const variants = {
    primary:
      'bg-white text-black border-white hover:bg-zinc-200 hover:border-zinc-300 shadow-[2px_2px_0px_0px_rgba(255,255,255,0.4)] hover:shadow-none',
    secondary:
      'bg-black text-white border-zinc-700 hover:border-white hover:bg-zinc-900 shadow-[2px_2px_0px_0px_rgba(255,255,255,0.15)]',
    danger:
      'bg-black text-zinc-200 border-zinc-600 hover:bg-white hover:text-black hover:border-white',
    ghost:
      'bg-transparent text-zinc-400 border-transparent hover:text-white hover:border-zinc-800',
  }[variant];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants} ${className}`}
    >
      {children}
    </button>
  );
}
