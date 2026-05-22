import clsx from "clsx";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost";
};

export function Button({ variant = "primary", className, ...props }: Props) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold transition duration-200 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" &&
          "bg-brand text-white shadow-brand hover:-translate-y-0.5 hover:bg-brand-dark hover:shadow-[0_18px_44px_-18px_rgba(255,45,120,0.8)] focus-visible:outline-brand",
        variant === "outline" &&
          "border border-brand/30 bg-white text-brand shadow-sm hover:-translate-y-0.5 hover:border-brand hover:bg-brand-soft focus-visible:outline-brand",
        variant === "ghost" && "text-brand hover:bg-brand-soft",
        className
      )}
      {...props}
    />
  );
}
