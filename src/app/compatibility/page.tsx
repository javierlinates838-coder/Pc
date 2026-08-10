"use client";

import { useMemo } from "react";
import { useBuildStore } from "@/lib/inventory/store";
import { PartSelector } from "@/components/build/part-selector";
import {
  CompatibilityResults,
  CompatibilitySummary,
} from "@/components/build/compatibility-results";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { analyzeCompatibility } from "@/lib/compatibility/engine";

export default function CompatibilityPage() {
  const { currentBuild } = useBuildStore();
  const compat = useMemo(
    () => analyzeCompatibility(currentBuild),
    [currentBuild]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Compatibility Checker
        </h1>
        <p className="text-[var(--color-muted-foreground)] mt-1">
          Real-time compatibility analysis across all component pairs
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>Select Parts</CardTitle>
            <CardDescription>
              Compatibility updates as you add components
            </CardDescription>
          </CardHeader>
          <PartSelector />
        </Card>

        <div className="xl:col-span-2 space-y-4">
          <CompatibilitySummary
            compatibleCount={compat.compatibleCount}
            warningCount={compat.warningCount}
            incompatibleCount={compat.incompatibleCount}
            overallStatus={compat.overallStatus}
          />
          <CompatibilityResults results={compat.results} />
        </div>
      </div>
    </div>
  );
}
