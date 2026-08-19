"use client";

import { formatCurrency } from "@/lib/utils";

interface BuildFinancialBarProps {
  partsTotal: number;
  costTotal: number;
  listPrice: number;
  profit: number;
  purchasePrice?: number;
  netProfitAfterFees?: number | null;
  bestPlatformName?: string | null;
}

export function BuildFinancialBar({
  partsTotal,
  costTotal,
  listPrice,
  profit,
  purchasePrice = 0,
  netProfitAfterFees,
  bestPlatformName,
}: BuildFinancialBarProps) {
  const profitPositive = profit >= 0;
  const flipCosts = costTotal - partsTotal;
  const hasPurchase = purchasePrice > 0;
  const hasNetProfit = netProfitAfterFees !== null && netProfitAfterFees !== undefined;
  const netPositive = hasNetProfit && netProfitAfterFees >= 0;

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-3 sm:px-5 sm:py-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
            Parts value
          </p>
          <p className="mt-0.5 text-lg font-bold tabular-nums sm:text-xl">
            {formatCurrency(partsTotal)}
          </p>
        </div>
        {hasPurchase ? (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
              You pay
            </p>
            <p className="mt-0.5 text-lg font-bold tabular-nums sm:text-xl">
              {formatCurrency(purchasePrice)}
            </p>
          </div>
        ) : (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
              + Ship & prep
            </p>
            <p className="mt-0.5 text-lg font-bold tabular-nums sm:text-xl">
              {formatCurrency(flipCosts)}
            </p>
          </div>
        )}
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
            {hasPurchase && hasNetProfit
              ? `Profit (${bestPlatformName ?? "fees"})`
              : "Margin (no fees)"}
          </p>
          <p
            className={`mt-0.5 text-lg font-bold tabular-nums sm:text-xl ${
              hasPurchase && hasNetProfit
                ? netPositive
                  ? "text-[var(--color-success)]"
                  : "text-[var(--color-destructive)]"
                : profitPositive
                  ? "text-[var(--color-success)]"
                  : "text-[var(--color-destructive)]"
            }`}
          >
            {hasPurchase && hasNetProfit
              ? `${netPositive ? "+" : ""}${formatCurrency(netProfitAfterFees!)}`
              : `${profitPositive ? "+" : ""}${formatCurrency(profit)}`}
          </p>
        </div>
      </div>
      {!hasPurchase && (
        <p className="mt-2 text-[10px] text-[var(--color-muted-foreground)]">
          Analyze a deal or set purchase price on Profit to see fee-adjusted profit.
        </p>
      )}
    </div>
  );
}
