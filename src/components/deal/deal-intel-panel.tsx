"use client";

import type { DealIntelligence } from "@/lib/reseller/deal-intelligence";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DealIntelPanelProps {
  intel: DealIntelligence;
  compact?: boolean;
}

const SEVERITY_STYLES = {
  critical: "border-red-500/40 bg-red-500/10 text-red-300",
  warning: "border-amber-500/40 bg-amber-500/10 text-amber-200",
  info: "border-[var(--color-border)] bg-[var(--color-secondary)]/50",
  positive: "border-green-500/40 bg-green-500/10 text-green-300",
};

export function DealIntelPanel({ intel, compact = false }: DealIntelPanelProps) {
  const redFlags = intel.redFlags.slice(0, compact ? 6 : 12);
  const strengths = intel.strengths.slice(0, compact ? 4 : 8);

  return (
    <div className="space-y-4">
      {redFlags.length > 0 && (
        <div>
          {!compact && (
            <p className="mb-2 text-sm font-semibold text-red-400">Watch out for</p>
          )}
          <ul className="space-y-2">
            {redFlags.map((item, i) => (
              <li
                key={i}
                className={`rounded-xl border p-3 text-sm ${SEVERITY_STYLES[item.severity]}`}
              >
                <p className="font-medium">{item.title}</p>
                <p className="mt-1 text-xs opacity-90">{item.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {strengths.length > 0 && !compact && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-[var(--color-success)]">
              Strengths
            </CardTitle>
          </CardHeader>
          <ul className="space-y-2 text-sm">
            {strengths.map((item, i) => (
              <li key={i} className="rounded-lg bg-[var(--color-secondary)]/50 p-2">
                <span className="font-medium">{item.title}</span>
                <span className="text-[var(--color-muted-foreground)]">
                  — {item.detail}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {intel.inspectionChecklist.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold">Before you buy</p>
          <ul className="space-y-1 text-sm">
            {intel.inspectionChecklist.map((item, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-[var(--color-primary)]">□</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {intel.bestPlatforms.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <span className="text-xs text-[var(--color-muted-foreground)]">
            Good channels:
          </span>
          {intel.bestPlatforms.map((p) => (
            <Badge key={p} variant="secondary">{p}</Badge>
          ))}
        </div>
      )}
    </div>
  );
}
