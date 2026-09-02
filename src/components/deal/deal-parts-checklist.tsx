"use client";

import { CheckCircle2, CircleDashed, HelpCircle } from "lucide-react";
import type { BuildPartEntry } from "@/lib/types/components";
import { buildPartValueBreakdown } from "@/lib/pricing/estimator";
import { formatCurrency } from "@/lib/utils";
import type { MissingPartInfo } from "@/lib/reseller/deal-readiness";

interface DealPartsChecklistProps {
  found: { key: string; label: string }[];
  missing: MissingPartInfo[];
  partBreakdown: BuildPartEntry[];
  parsedNames: string[];
}

export function DealPartsChecklist({
  found,
  missing,
  partBreakdown,
  parsedNames,
}: DealPartsChecklistProps) {
  const values = buildPartValueBreakdown(partBreakdown);
  const valueByName = new Map(values.map((v) => [v.partName, v]));

  return (
    <div className="glass-panel space-y-4 rounded-2xl p-4 sm:p-5">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-primary)]">
          Step 1 · What we read from the listing
        </p>
        <h3 className="mt-1 text-base font-semibold">Parts checklist</h3>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          Green = matched from your paste. Gray = not mentioned yet (value estimate
          may be too low without them).
        </p>
      </div>

      <div className="space-y-2">
        {parsedNames.map((name) => {
          const val = valueByName.get(name);
          return (
            <div
              key={name}
              className="flex items-start justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-3 py-2.5"
            >
              <div className="flex min-w-0 items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-snug">{name}</p>
                  {val && (
                    <p className="text-xs text-[var(--color-muted-foreground)]">
                      Used value ≈ {formatCurrency(val.usedValueMin)}–
                      {formatCurrency(val.usedValueMax)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {missing.length > 0 && (
        <div className="space-y-2 border-t border-[var(--color-border)] pt-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-muted-foreground)]">
            <HelpCircle className="h-3.5 w-3.5" />
            Not found in listing — ask the seller or paste more specs
          </p>
          {missing.slice(0, 5).map((item) => (
            <div
              key={item.key}
              className="flex items-start gap-2 rounded-xl border border-dashed border-[var(--color-border)] px-3 py-2"
            >
              <CircleDashed className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]" />
              <div>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  {item.label}
                </p>
                <p className="text-[11px] text-[var(--color-muted-foreground)]/80">
                  {item.why}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {found.length > 0 && missing.length > 0 && (
        <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-200/90">
          Tip: Facebook sellers often skip RAM and SSD in the title. Scroll the full
          post or message them — missing parts make our resale estimate lower than
          reality.
        </p>
      )}
    </div>
  );
}
