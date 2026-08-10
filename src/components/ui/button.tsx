import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
}

const variants = {
  default:
    "bg-[var(--color-primary)] text-white hover:bg-blue-600 shadow-sm",
  secondary:
    "bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)] hover:bg-slate-700",
  outline:
    "border border-[var(--color-border)] bg-transparent hover:bg-[var(--color-secondary)]",
  ghost: "hover:bg-[var(--color-secondary)]",
  destructive:
    "bg-[var(--color-destructive)] text-white hover:bg-red-600",
};

const sizes = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export function Button({
  className,
  variant = "default",
  size = "md",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
