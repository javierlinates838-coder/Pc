"use client";

import { formatCurrency } from "@/lib/utils";

interface OfferSliderProps {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  profit: number;
  roi: number;
}

export function OfferSlider({
  min,
  max,
  value,
  onChange,
  profit,
  roi,
}: OfferSliderProps) {
  const safeMax = Math.max(max, min + 50);

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5">
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
            Drag your offer
          </p>
          <p className="metric-hero mt-1 text-3xl font-bold tabular-nums text-[var(--color-primary)] sm:text-4xl">
            {formatCurrency(value)}
          </p>
        </div>
        <div className="text-right">
          <p
            className={`text-xl font-bold tabular-nums ${profit >= 0 ? "text-[var(--color-success)]" : "text-[var(--color-destructive)]"}`}
          >
            {profit >= 0 ? "+" : ""}
            {formatCurrency(profit)}
          </p>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            {roi.toFixed(0)}% ROI
          </p>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={safeMax}
        step={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-4 h-2 w-full cursor-pointer appearance-none rounded-full bg-[var(--color-secondary)] accent-[var(--color-primary)]"
      />
      <div className="mt-2 flex justify-between text-[10px] text-[var(--color-muted-foreground)]">
        <span>{formatCurrency(min)}</span>
        <span>Listing {formatCurrency(safeMax)}</span>
      </div>
      <p className="mt-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-secondary)]/40 px-3 py-2 text-xs text-[var(--color-muted-foreground)]">
        &quot;Would you take {formatCurrency(value)}? I can pick up today.&quot;
      </p>
    </div>
  );
}
