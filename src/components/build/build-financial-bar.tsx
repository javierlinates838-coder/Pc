"use client";

import { formatCurrency } from "@/lib/utils";

interface BuildFinancialBarProps {
  partsTotal: number;
  costTotal: number;
  listPrice: number;
  profit: number;
}

export function BuildFinancialBar({
  partsTotal,
  costTotal,
  listPrice,
  profit,
}: BuildFinancialBarProps) {
  const profitPositive = profit >= 0;
  const flipCosts = costTotal - partsTotal;

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-3 sm:px-5 sm:py-4">
      <p className="mb-2 text-[10px] text-[var(--color-muted-foreground)]">
        Estimates from part values — not your purchase price. Add what you paid
        on the Deal or Profit pages.
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
            Parts value
          </p>
          <p className="mt-0.5 text-lg font-bold tabular-nums sm:text-xl">
            {formatCurrency(partsTotal)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
            + Ship & prep
          </p>
          <p className="mt-0.5 text-lg font-bold tabular-nums sm:text-xl">
            {formatCurrency(flipCosts)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
            List price est.
          </p>
          <p className="mt-0.5 text-lg font-bold tabular-nums text-[var(--color-primary)] sm:text-xl">
            {formatCurrency(listPrice)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
            Margin (no fees)
          </p>
          <p
            className={`mt-0.5 text-lg font-bold tabular-nums sm:text-xl ${profitPositive ? "text-[var(--color-success)]" : "text-[var(--color-destructive)]"}`}
          >
            {profitPositive ? "+" : ""}
            {formatCurrency(profit)}
          </p>
        </div>
      </div>
    </div>
  );
}
