"use client";

import type { CompatibilityResult } from "@/lib/types/compatibility";
import { Card, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";

const icons = {
  compatible: CheckCircle,
  warning: AlertTriangle,
  incompatible: XCircle,
};

const colors = {
  compatible: "text-green-400",
  warning: "text-amber-400",
  incompatible: "text-red-400",
};

export function CompatibilityResults({
  results,
}: {
  results: CompatibilityResult[];
}) {
  if (results.length === 0) {
    return (
      <Card>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Add components to see compatibility results.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {results.map((result) => {
        const Icon = icons[result.status];
        return (
          <Card key={result.id} className="p-4">
            <div className="flex items-start gap-3">
              <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${colors[result.status]}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-medium text-sm">{result.title}</span>
                  <StatusBadge status={result.status} />
                  <span className="text-xs text-[var(--color-muted-foreground)]">
                    {result.category}
                  </span>
                </div>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  {result.message}
                </p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

export function CompatibilitySummary({
  compatibleCount,
  warningCount,
  incompatibleCount,
  overallStatus,
}: {
  compatibleCount: number;
  warningCount: number;
  incompatibleCount: number;
  overallStatus: string;
}) {
  return (
    <div className="grid grid-cols-4 gap-3">
      <Card className="text-center p-4">
        <CardTitle className="text-2xl text-green-400">{compatibleCount}</CardTitle>
        <p className="text-xs text-[var(--color-muted-foreground)] mt-1">Compatible</p>
      </Card>
      <Card className="text-center p-4">
        <CardTitle className="text-2xl text-amber-400">{warningCount}</CardTitle>
        <p className="text-xs text-[var(--color-muted-foreground)] mt-1">Warnings</p>
      </Card>
      <Card className="text-center p-4">
        <CardTitle className="text-2xl text-red-400">{incompatibleCount}</CardTitle>
        <p className="text-xs text-[var(--color-muted-foreground)] mt-1">Incompatible</p>
      </Card>
      <Card className="text-center p-4">
        <StatusBadge status={overallStatus as "compatible" | "warning" | "incompatible"} />
        <p className="text-xs text-[var(--color-muted-foreground)] mt-2">Overall</p>
      </Card>
    </div>
  );
}
