import { cn } from "@/lib/utils";

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "flex min-h-[100px] w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] px-3 py-2 text-base text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] disabled:opacity-50 resize-y sm:text-sm",
        className
      )}
      {...props}
    />
  );
}
