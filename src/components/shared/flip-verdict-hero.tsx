"use client";

import type { DealRating } from "@/lib/types/reseller";
import type { ResellerVerdict } from "@/lib/types/reseller";
import { DealRatingBadge, VerdictBadge } from "@/components/ui/status-badge";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

const RATING_GLOW: Record<DealRating, string> = {
  GREAT: "from-emerald-500/30 to-[var(--color-primary)]/20 text-emerald-300",
  GOOD: "from-sky-500/25 to-[var(--color-primary)]/15 text-sky-300",
  FAIR: "from-amber-500/25 to-[var(--color-primary)]/10 text-amber-300",
  BAD: "from-red-500/25 to-[var(--color-primary)]/10 text-red-300",
};

interface FlipVerdictHeroProps {
  rating?: DealRating;
  verdict?: ResellerVerdict;
  askingPrice: number;
  resalePrice: number;
  profitAfterFees: number;
  offerPrice: number;
  bestPlatform?: string;
  reason?: string;
  className?: string;
}

export function FlipVerdictHero({
  rating,
  verdict,
  askingPrice,
  resalePrice,
  profitAfterFees,
  offerPrice,
  bestPlatform,
  reason,
  className,
}: FlipVerdictHeroProps) {
  const profitPositive = profitAfterFees >= 0;
  const glow = rating ? RATING_GLOW[rating] : "from-[var(--color-primary)]/20 to-purple-500/10";

  return (
    <div
      className={cn(
        "glass-panel relative overflow-hidden rounded-2xl p-4 sm:p-6",
        className
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-50",
          glow
        )}
        aria-hidden
      />
      <div className="relative space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {rating && <DealRatingBadge rating={rating} />}
          {verdict && <VerdictBadge verdict={verdict} />}
          {bestPlatform && (
            <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-secondary)]/60 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
              Best: {bestPlatform}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Metric label="They want" value={formatCurrency(askingPrice)} />
          <Metric
            label="You sell for"
            value={formatCurrency(resalePrice)}
            accent="success"
          />
          <Metric
            label="Profit after fees"
            value={`${profitPositive ? "+" : ""}${formatCurrency(profitAfterFees)}`}
            accent={profitPositive ? "success" : "danger"}
            hero
          />
          <Metric
            label="Your offer"
            value={formatCurrency(offerPrice)}
            accent="primary"
          />
        </div>

        {reason && (
          <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">
            {reason}
          </p>
        )}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  accent,
  hero,
}: {
  label: string;
  value: string;
  accent?: "success" | "danger" | "primary";
  hero?: boolean;
}) {
  const color =
    accent === "success"
      ? "text-[var(--color-success)]"
      : accent === "danger"
        ? "text-[var(--color-destructive)]"
        : accent === "primary"
          ? "text-[var(--color-primary)]"
          : "text-[var(--color-foreground)]";

  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 font-bold tabular-nums tracking-tight",
          hero ? "text-2xl sm:text-3xl" : "text-lg sm:text-xl",
          color
        )}
      >
        {value}
      </p>
    </div>
  );
}
