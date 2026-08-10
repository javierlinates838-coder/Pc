import type { CompatibilityStatus } from "@/lib/types/compatibility";
import { Badge } from "./badge";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";

const statusConfig: Record<
  CompatibilityStatus,
  { label: string; variant: "success" | "warning" | "destructive"; icon: typeof CheckCircle }
> = {
  compatible: { label: "Compatible", variant: "success", icon: CheckCircle },
  warning: { label: "Warning", variant: "warning", icon: AlertTriangle },
  incompatible: { label: "Incompatible", variant: "destructive", icon: XCircle },
};

export function StatusBadge({ status }: { status: CompatibilityStatus }) {
  const config = statusConfig[status];
  const Icon = config.icon;
  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
}

export function DealRatingBadge({
  rating,
}: {
  rating: "GREAT" | "GOOD" | "FAIR" | "BAD";
}) {
  const variants: Record<string, "success" | "default" | "warning" | "destructive"> = {
    GREAT: "success",
    GOOD: "default",
    FAIR: "warning",
    BAD: "destructive",
  };
  return <Badge variant={variants[rating]}>{rating}</Badge>;
}

export function VerdictBadge({
  verdict,
}: {
  verdict: string;
}) {
  const variant =
    verdict.includes("EXCELLENT") || verdict.includes("GOOD")
      ? "success"
      : verdict.includes("MARGINAL")
        ? "warning"
        : "destructive";
  return <Badge variant={variant}>{verdict}</Badge>;
}
