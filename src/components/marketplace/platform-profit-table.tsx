"use client";

import { formatCurrency, formatPercent } from "@/lib/utils";
import type { PlatformProfitResult } from "@/lib/marketplaces/calculate";
import { cn } from "@/lib/utils";

interface PlatformProfitTableProps {
  results: PlatformProfitResult[];
  highlightBest?: boolean;
}

export function PlatformProfitTable({
  results,
  highlightBest = true,
}: PlatformProfitTableProps) {
  return (
    <div className="table-scroll -mx-1">
      <table className="w-full text-xs sm:text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border)] text-left">
            <th className="py-2 pr-2 font-medium">Platform</th>
            <th className="py-2 pr-2 font-medium">Fees</th>
            <th className="py-2 pr-2 font-medium text-right">Net profit</th>
            <th className="py-2 font-medium text-right">ROI</th>
          </tr>
        </thead>
        <tbody>
          {results.map((row) => {
            const isBest = highlightBest && row.rank === 1;
            return (
              <tr
                key={row.marketplaceId}
                className={cn(
                  "border-b border-[var(--color-border)]/40",
                  isBest && "bg-[var(--color-primary)]/10"
                )}
              >
                <td className="py-2.5 pr-2">
                  <span className="font-medium">{row.shortName}</span>
                  {isBest && (
                    <span className="ml-1 text-[10px] text-[var(--color-primary)]">
                      BEST
                    </span>
                  )}
                </td>
                <td className="py-2.5 pr-2 text-[var(--color-muted-foreground)]">
                  {formatCurrency(row.totalFees)}
                </td>
                <td
                  className={cn(
                    "py-2.5 pr-2 text-right font-semibold tabular-nums",
                    row.netProfit >= 0
                      ? "text-[var(--color-success)]"
                      : "text-[var(--color-destructive)]"
                  )}
                >
                  {formatCurrency(row.netProfit)}
                </td>
                <td className="py-2.5 text-right tabular-nums text-[var(--color-muted-foreground)]">
                  {formatPercent(row.roiPercent)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
