"use client";

type Props = {
  label: string | null;
};

export function TypingIndicator({ label }: Props) {
  if (!label) return null;

  return (
    <div className="flex items-center gap-2 px-1 text-xs font-semibold text-slate-500" aria-live="polite">
      <span className="inline-flex gap-0.5" aria-hidden>
        <span className="inline-block h-1 w-1 animate-bounce rounded-full bg-slate-400 [animation-duration:1s]" />
        <span className="inline-block h-1 w-1 animate-bounce rounded-full bg-slate-400 [animation-duration:1s] [animation-delay:150ms]" />
        <span className="inline-block h-1 w-1 animate-bounce rounded-full bg-slate-400 [animation-duration:1s] [animation-delay:300ms]" />
      </span>
      <span>{label}</span>
    </div>
  );
}
