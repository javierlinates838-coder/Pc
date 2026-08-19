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

  return (
    <div className="grid grid-cols-3 gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-3 sm:gap-4 sm:px-5 sm:py-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
          Parts
        </p>
        <p className="mt-0.5 text-lg font-bold tabular-nums sm:text-xl">
          {formatCurrency(partsTotal)}
        </p>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
          Cost
        </p>
        <p className="mt-0.5 text-lg font-bold tabular-nums sm:text-xl">
          {formatCurrency(costTotal)}
        </p>
      </div>
      <div className="text-right">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
          List / Profit
        </p>
        <p className="mt-0.5 text-sm font-bold tabular-nums sm:text-base">
          <span className="text-[var(--color-primary)]">
            {formatCurrency(listPrice)}
          </span>
          <span className="text-[var(--color-muted-foreground)]"> · </span>
          <span
            className={
              profitPositive ? "text-[var(--color-success)]" : "text-[var(--color-destructive)]"
            }
          >
            {profitPositive ? "+" : ""}
            {formatCurrency(profit)}
          </span>
        </p>
      </div>
    </div>
  );
}
