import clsx from "clsx";
import { Icon, type IconName } from "@/components/common/Icons";

export { Icon, type IconName } from "@/components/common/Icons";

export function Card({
  children,
  className,
  hover = false,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={clsx(
        "rounded-3xl border border-white/70 bg-white/[0.88] p-5 shadow-xl shadow-slate-200/70 backdrop-blur",
        hover && "transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_60px_-24px_rgba(255,45,120,0.55)]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function IconBubble({
  icon,
  className,
}: {
  icon: IconName;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand shadow-lg shadow-brand/15",
        className
      )}
    >
      <Icon name={icon} className="h-5 w-5" />
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.replace("_", " ");
  const classes =
    status === "resolved" || status === "closed"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : status === "in_progress" || status === "active"
        ? "bg-amber-50 text-amber-700 ring-amber-200"
        : "bg-sky-50 text-sky-700 ring-sky-200";

  return (
    <span className={clsx("rounded-full px-3 py-1 text-xs font-bold capitalize ring-1", classes)}>
      {normalized}
    </span>
  );
}

export function SeverityPill({ value }: { value: number }) {
  const level = value >= 4 ? "bg-rose-500" : value >= 3 ? "bg-amber-400" : "bg-sky-500";
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
      <span className={clsx("h-2.5 w-2.5 rounded-full", level)} />
      Severity {value}
    </span>
  );
}

export function StatCard({
  label,
  value,
  icon,
  trend,
  tone = "pink",
}: {
  label: string;
  value: string | number;
  icon: IconName;
  trend?: string;
  tone?: "pink" | "blue" | "green" | "amber";
}) {
  const tones = {
    pink: "from-brand/18 to-sky-100 text-brand",
    blue: "from-sky-100 to-white text-sky-600",
    green: "from-emerald-100 to-white text-emerald-600",
    amber: "from-amber-100 to-white text-amber-600",
  };
  return (
    <Card hover className={clsx("bg-gradient-to-br", tones[tone])}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-2 text-4xl font-black tracking-tight text-slate-950">{value}</p>
        </div>
        <IconBubble icon={icon} className="bg-white/80" />
      </div>
      {trend && (
        <p className="mt-4 inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1 text-xs font-bold text-emerald-700">
          <Icon name="arrowUp" className="h-3.5 w-3.5" />
          {trend}
        </p>
      )}
    </Card>
  );
}

export function EmptyState({
  icon,
  title,
  text,
}: {
  icon: IconName;
  title: string;
  text: string;
}) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-gradient-to-br from-white to-slate-50 px-6 py-10 text-center">
      <div className="relative">
        <span className="absolute inset-0 rounded-full bg-brand/20 blur-xl" />
        <IconBubble icon={icon} className="relative h-16 w-16 rounded-3xl bg-white text-brand" />
      </div>
      <h3 className="mt-5 text-lg font-black text-slate-950">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">{text}</p>
    </div>
  );
}

export function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="animate-pulse rounded-3xl border border-slate-100 bg-white p-4">
          <div className="h-4 w-2/3 rounded-full bg-slate-200" />
          <div className="mt-3 h-3 w-full rounded-full bg-slate-100" />
          <div className="mt-2 h-3 w-1/2 rounded-full bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export function Toast({ message, type = "success" }: { message: string; type?: "success" | "error" }) {
  return (
    <div
      className={clsx(
        "fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold shadow-2xl animate-rise",
        type === "success" ? "bg-slate-950 text-white" : "bg-rose-600 text-white"
      )}
    >
      <Icon name={type === "success" ? "check" : "issue"} className="h-4 w-4" />
      {message}
    </div>
  );
}
