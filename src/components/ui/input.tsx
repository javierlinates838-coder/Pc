import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "flex h-11 min-h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] px-3 py-2 text-base text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] disabled:opacity-50 sm:h-10 sm:text-sm",
        className
      )}
      {...props}
    />
  );
}
