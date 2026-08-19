"use client";

import type { DealIntelligence } from "@/lib/reseller/deal-intelligence";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DealIntelPanelProps {
  intel: DealIntelligence;
}

const SEVERITY_STYLES = {
  critical: "border-red-500/40 bg-red-500/10 text-red-300",
  warning: "border-amber-500/40 bg-amber-500/10 text-amber-200",
  info: "border-[var(--color-border)] bg-[var(--color-secondary)]/50",
  positive: "border-green-500/40 bg-green-500/10 text-green-300",
};

export function DealIntelPanel({ intel }: DealIntelPanelProps) {
  return (
    <div className="space-y-4">
      {intel.redFlags.length > 0 && (
        <Card className="border-red-500/20">
          <CardHeader>
            <CardTitle className="text-base text-red-400">Red flags</CardTitle>
          </CardHeader>
          <ul className="space-y-2">
            {intel.redFlags.map((item, i) => (
              <li
                key={i}
                className={`rounded-xl border p-3 text-sm ${SEVERITY_STYLES[item.severity]}`}
              >
                <p className="font-medium">{item.title}</p>
                <p className="mt-1 text-xs opacity-90">{item.detail}</p>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {intel.strengths.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-[var(--color-success)]">
              Strengths
            </CardTitle>
          </CardHeader>
          <ul className="space-y-2 text-sm">
            {intel.strengths.map((item, i) => (
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Inspection checklist</CardTitle>
        </CardHeader>
        <ul className="space-y-1 text-sm">
          {intel.inspectionChecklist.map((item, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-[var(--color-primary)]">□</span>
              {item}
            </li>
          ))}
        </ul>
      </Card>

      <Card className="border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5">
        <CardHeader>
          <CardTitle className="text-base">Why we beat spreadsheets</CardTitle>
        </CardHeader>
        <ul className="space-y-2 text-xs text-[var(--color-muted-foreground)]">
          {intel.competitorGaps.map((g, i) => (
            <li key={i}>• {g}</li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap gap-1">
          {intel.bestPlatforms.map((p) => (
            <Badge key={p} variant="secondary">{p}</Badge>
          ))}
        </div>
      </Card>
    </div>
  );
}
