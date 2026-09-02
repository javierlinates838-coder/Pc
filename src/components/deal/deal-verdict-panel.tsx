"use client";

import { ArrowRight, DollarSign, TrendingDown, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { PlainEnglishDeal } from "@/lib/reseller/deal-plain-english";

const TONE_STYLES: Record<
  PlainEnglishDeal["tone"],
  { border: string; bg: string; icon: typeof TrendingUp }
> = {
  great: {
    border: "border-emerald-500/40",
    bg: "from-emerald-500/20 to-[var(--color-primary)]/10",
    icon: TrendingUp,
  },
  good: {
    border: "border-sky-500/40",
    bg: "from-sky-500/20 to-[var(--color-primary)]/10",
    icon: TrendingUp,
  },
  caution: {
    border: "border-amber-500/40",
    bg: "from-amber-500/20 to-[var(--color-primary)]/10",
    icon: DollarSign,
  },
  bad: {
    border: "border-red-500/40",
    bg: "from-red-500/20 to-[var(--color-primary)]/10",
    icon: TrendingDown,
  },
  incomplete: {
    border: "border-[var(--color-border)]",
    bg: "from-[var(--color-secondary)]/40 to-transparent",
    icon: DollarSign,
  },
};

interface DealVerdictPanelProps {
  plain: PlainEnglishDeal;
  askingPrice: number;
  resalePrice: number;
  profitAfterFees: number;
  offerPrice: number;
  bestPlatform?: string;
  showMath: boolean;
}

export function DealVerdictPanel({
  plain,
  askingPrice,
  resalePrice,
  profitAfterFees,
  offerPrice,
  bestPlatform,
  showMath,
}: DealVerdictPanelProps) {
  const style = TONE_STYLES[plain.tone];
  const Icon = style.icon;
  const profitPositive = profitAfterFees >= 0;

  return (
    <div
      className={cn(
        "glass-panel relative overflow-hidden rounded-2xl border p-4 sm:p-6",
        style.border
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-60",
          style.bg
        )}
        aria-hidden
      />
      <div className="relative space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-secondary)]/80">
            <Icon className="h-5 w-5 text-[var(--color-primary)]" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
              Step 2 · Should you buy it?
            </p>
            <h2 className="mt-0.5 text-xl font-bold leading-tight sm:text-2xl">
              {plain.headline}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
              {plain.explanation}
            </p>
          </div>
        </div>

        {showMath && (
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)]/60 p-3 sm:p-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
              Simple math
            </p>
            <div className="flex flex-col gap-2 text-sm sm:flex-row sm:flex-wrap sm:items-center">
              <MathStep label="Seller wants" value={formatCurrency(askingPrice)} />
              <ArrowRight className="hidden h-4 w-4 text-[var(--color-muted-foreground)] sm:block" />
              <MathStep
                label="Worth about"
                value={formatCurrency(resalePrice)}
                hint="complete PC resale"
              />
              <ArrowRight className="hidden h-4 w-4 text-[var(--color-muted-foreground)] sm:block" />
              <MathStep
                label="Your profit"
                value={`${profitPositive ? "+" : ""}${formatCurrency(profitAfterFees)}`}
                highlight={profitPositive ? "good" : "bad"}
                hint="after fees"
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--color-border)] pt-3 text-xs text-[var(--color-muted-foreground)]">
              <span>
                Suggested offer:{" "}
                <strong className="text-[var(--color-foreground)]">
                  {formatCurrency(offerPrice)}
                </strong>
              </span>
              {bestPlatform && (
                <>
                  <span aria-hidden>·</span>
                  <span>
                    Best place to sell:{" "}
                    <strong className="text-[var(--color-foreground)]">
                      {bestPlatform}
                    </strong>
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        <p className="text-sm font-medium text-[var(--color-foreground)]">
          → {plain.actionLabel}
        </p>
      </div>
    </div>
  );
}

function MathStep({
  label,
  value,
  hint,
  highlight,
}: {
  label: string;
  value: string;
  hint?: string;
  highlight?: "good" | "bad";
}) {
  return (
    <div className="rounded-lg bg-[var(--color-secondary)]/50 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-[var(--color-muted-foreground)]">
        {label}
      </p>
      <p
        className={cn(
          "font-bold tabular-nums",
          highlight === "good" && "text-[var(--color-success)]",
          highlight === "bad" && "text-[var(--color-destructive)]"
        )}
      >
        {value}
      </p>
      {hint && (
        <p className="text-[10px] text-[var(--color-muted-foreground)]">{hint}</p>
      )}
    </div>
  );
}
