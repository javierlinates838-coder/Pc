import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "destructive" | "secondary";
  className?: string;
}

const variants = {
  default: "bg-[var(--color-primary)]/20 text-[var(--color-accent-foreground)]",
  success: "bg-green-500/20 text-green-400",
  warning: "bg-amber-500/20 text-amber-400",
  destructive: "bg-red-500/20 text-red-400",
  secondary: "bg-[var(--color-secondary)] text-[var(--color-muted-foreground)]",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
