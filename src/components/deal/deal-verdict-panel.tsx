"use client";

import { DollarSign, TrendingDown, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { PlainEnglishDeal } from "@/lib/reseller/deal-plain-english";
import type { DealProfitLedger } from "@/lib/reseller/deal-math";
import type { ResaleValuation } from "@/lib/reseller/deal-valuation";

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
  ledger: DealProfitLedger | null;
  valuation: ResaleValuation | null;
  showMath: boolean;
}

export function DealVerdictPanel({
  plain,
  ledger,
  valuation,
  showMath,
}: DealVerdictPanelProps) {
  const style = TONE_STYLES[plain.tone];
  const Icon = style.icon;
  const profitPositive = (ledger?.netProfit ?? 0) >= 0;

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

        {showMath && ledger && valuation && (
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)]/60 p-3 sm:p-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
              How we calculated this
            </p>
            <div className="space-y-2 text-sm">
              <LedgerRow
                label="You pay the seller"
                value={formatCurrency(ledger.askingPrice)}
              />
              <LedgerRow
                label="Gas / prep / supplies"
                value={formatCurrency(ledger.shippingPrep + ledger.otherCosts)}
                hint={`${formatCurrency(ledger.shippingPrep)} prep + ${formatCurrency(ledger.otherCosts)} misc`}
              />
              <LedgerRow
                label="Total cash in"
                value={formatCurrency(ledger.totalYouSpend)}
                bold
              />
              <div className="my-2 border-t border-dashed border-[var(--color-border)]" />
              <LedgerRow
                label="You sell the PC for"
                value={formatCurrency(ledger.resalePrice)}
                hint={valuation.sourceLabel}
              />
              {ledger.saleFees > 0 && (
                <LedgerRow
                  label="Selling fees"
                  value={`−${formatCurrency(ledger.saleFees)}`}
                  hint={ledger.saleFeeNote}
                />
              )}
              <LedgerRow
                label="Money left over"
                value={`${profitPositive ? "+" : ""}${formatCurrency(ledger.netProfit)}`}
                bold
                highlight={profitPositive ? "good" : "bad"}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 border-t border-[var(--color-border)] pt-3 text-xs text-[var(--color-muted-foreground)]">
              <span>
                Parts add up to ~{formatCurrency(valuation.partOutMid)} parted out
              </span>
              <span aria-hidden>·</span>
              <span>
                Offer up to {formatCurrency(ledger.offerPrice)} to leave room for profit
              </span>
              <span aria-hidden>·</span>
              <span>Best to sell on {ledger.bestPlatform}</span>
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

function LedgerRow({
  label,
  value,
  hint,
  bold,
  highlight,
}: {
  label: string;
  value: string;
  hint?: string;
  bold?: boolean;
  highlight?: "good" | "bad";
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-[var(--color-muted-foreground)]">{label}</p>
        {hint && (
          <p className="text-[10px] text-[var(--color-muted-foreground)]/80">
            {hint}
          </p>
        )}
      </div>
      <p
        className={cn(
          "shrink-0 tabular-nums",
          bold && "text-base font-bold",
          highlight === "good" && "text-[var(--color-success)]",
          highlight === "bad" && "text-[var(--color-destructive)]"
        )}
      >
        {value}
      </p>
    </div>
  );
}
