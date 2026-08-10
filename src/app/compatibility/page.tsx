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
import { PageHeader } from "@/components/layout/page-header";

export default function CompatibilityPage() {
  const { currentBuild } = useBuildStore();
  const compat = useMemo(
    () => analyzeCompatibility(currentBuild),
    [currentBuild]
  );

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Compatibility Checker"
        description="Real-time compatibility analysis across all component pairs"
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3 xl:gap-6">
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
