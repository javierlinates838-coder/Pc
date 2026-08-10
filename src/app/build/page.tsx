"use client";

import { useMemo } from "react";
import { useBuildStore } from "@/lib/inventory/store";
import { PartSelector } from "@/components/build/part-selector";
import {
  CompatibilityResults,
  CompatibilitySummary,
} from "@/components/build/compatibility-results";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { analyzeCompatibility } from "@/lib/compatibility/engine";
import {
  calculateBuildQualityScore,
  estimatePerformance,
  generateResellerRecommendation,
  getUpgradeRecommendations,
} from "@/lib/reseller/analyzer";
import { componentMapToEntries } from "@/lib/build/helpers";
import {
  buildPartValueBreakdown,
  compareValueStrategies,
  estimatePartValue,
} from "@/lib/pricing/estimator";
import { formatCurrency } from "@/lib/utils";
import { VerdictBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/layout/page-header";

export default function BuildAnalyzerPage() {
  const { currentBuild } = useBuildStore();

  const compat = useMemo(
    () => analyzeCompatibility(currentBuild),
    [currentBuild]
  );
  const quality = useMemo(
    () => calculateBuildQualityScore(currentBuild),
    [currentBuild]
  );
  const performance = useMemo(
    () => estimatePerformance(currentBuild),
    [currentBuild]
  );
  const entries = useMemo(
    () => componentMapToEntries(currentBuild),
    [currentBuild]
  );
  const partValues = useMemo(
    () => buildPartValueBreakdown(entries),
    [entries]
  );
  const strategy = useMemo(
    () => compareValueStrategies(entries),
    [entries]
  );
  const upgrades = useMemo(
    () => getUpgradeRecommendations(currentBuild),
    [currentBuild]
  );
  const recommendation = useMemo(
    () => generateResellerRecommendation(currentBuild, 0),
    [currentBuild]
  );

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Build Analyzer"
        description="Select parts, check compatibility, and analyze resale potential"
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3 xl:gap-6">
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>Components</CardTitle>
            <CardDescription>Select or change build parts</CardDescription>
          </CardHeader>
          <PartSelector />
        </Card>

        <div className="xl:col-span-2 space-y-6">
          {entries.length > 0 && (
            <>
              <CompatibilitySummary
                compatibleCount={compat.compatibleCount}
                warningCount={compat.warningCount}
                incompatibleCount={compat.incompatibleCount}
                overallStatus={compat.overallStatus}
              />

              <Card>
                <CardHeader>
                  <CardTitle>Build Quality Score</CardTitle>
                  <CardDescription>
                    Based on performance, balance, upgradeability, and resale appeal
                  </CardDescription>
                </CardHeader>
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
                  <div className="text-4xl font-bold text-[var(--color-primary)] sm:text-5xl">
                    {quality.total}
                  </div>
                  <div className="flex-1">
                    <div className="h-3 rounded-full bg-[var(--color-secondary)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--color-primary)] transition-all"
                        style={{ width: `${quality.total}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3 text-xs">
                      {Object.entries(quality.breakdown).map(([key, val]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-[var(--color-muted-foreground)] capitalize">
                            {key.replace(/([A-Z])/g, " $1")}
                          </span>
                          <span>{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {quality.explanation.length > 0 && (
                  <ul className="mt-4 space-y-1">
                    {quality.explanation.map((e, i) => (
                      <li
                        key={i}
                        className="text-sm text-[var(--color-muted-foreground)]"
                      >
                        • {e}
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Build Breakdown</CardTitle>
                </CardHeader>
                <div className="table-scroll">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--color-border)]">
                        <th className="text-left py-2 font-medium">Part</th>
                        <th className="text-left py-2 font-medium">Category</th>
                        <th className="text-left py-2 font-medium">Tier</th>
                        <th className="text-right py-2 font-medium">Used Value</th>
                        <th className="text-right py-2 font-medium">New Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((entry) => {
                        const val = estimatePartValue(
                          entry.component,
                          entry.condition
                        );
                        return (
                          <tr
                            key={entry.component.id}
                            className="border-b border-[var(--color-border)]/50"
                          >
                            <td className="py-2.5">{entry.component.name}</td>
                            <td className="py-2.5 capitalize text-[var(--color-muted-foreground)]">
                              {entry.component.category}
                            </td>
                            <td className="py-2.5">
                              <Badge variant="secondary">
                                {entry.component.performanceTier}
                              </Badge>
                            </td>
                            <td className="py-2.5 text-right">
                              {formatCurrency(val.min)}–{formatCurrency(val.max)}
                            </td>
                            <td className="py-2.5 text-right text-[var(--color-muted-foreground)]">
                              {entry.component.pricing.newMax > 0
                                ? `${formatCurrency(entry.component.pricing.newMin)}–${formatCurrency(entry.component.pricing.newMax)}`
                                : "N/A"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Part-Out vs Complete PC</CardTitle>
                </CardHeader>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-4 rounded-lg bg-[var(--color-secondary)]">
                    <p className="text-xs text-[var(--color-muted-foreground)]">
                      Part-Out Value
                    </p>
                    <p className="text-xl font-bold mt-1">
                      {formatCurrency(strategy.partOutValueMin)}–
                      {formatCurrency(strategy.partOutValueMax)}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-[var(--color-secondary)]">
                    <p className="text-xs text-[var(--color-muted-foreground)]">
                      Complete PC Value
                    </p>
                    <p className="text-xl font-bold mt-1">
                      {formatCurrency(strategy.completePcValueMin)}–
                      {formatCurrency(strategy.completePcValueMax)}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={
                    strategy.betterStrategy === "complete-pc"
                      ? "success"
                      : strategy.betterStrategy === "part-out"
                        ? "warning"
                        : "secondary"
                  }
                >
                  Better: {strategy.betterStrategy.replace("-", " ").toUpperCase()}
                </Badge>
                <p className="text-sm text-[var(--color-muted-foreground)] mt-2">
                  {strategy.explanation}
                </p>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Estimate</CardTitle>
                  <CardDescription>{performance.disclaimer}</CardDescription>
                </CardHeader>
                <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <span className="text-[var(--color-muted-foreground)]">
                      Gaming 1080p:
                    </span>{" "}
                    {performance.gaming1080p}
                  </div>
                  <div>
                    <span className="text-[var(--color-muted-foreground)]">
                      Gaming 1440p:
                    </span>{" "}
                    {performance.gaming1440p}
                  </div>
                  <div>
                    <span className="text-[var(--color-muted-foreground)]">
                      Productivity:
                    </span>{" "}
                    {performance.productivity}
                  </div>
                  <div>
                    <span className="text-[var(--color-muted-foreground)]">
                      Streaming:
                    </span>{" "}
                    {performance.streaming}
                  </div>
                  <div>
                    <span className="text-[var(--color-muted-foreground)]">
                      AI:
                    </span>{" "}
                    {performance.ai}
                  </div>
                  <div>
                    <span className="text-[var(--color-muted-foreground)]">
                      Video Editing:
                    </span>{" "}
                    {performance.videoEditing}
                  </div>
                </div>
              </Card>

              {upgrades.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Upgrade Recommendations</CardTitle>
                    <CardDescription>
                      Ranked by profit potential
                    </CardDescription>
                  </CardHeader>
                  <div className="space-y-3">
                    {upgrades.map((u, i) => (
                      <div
                        key={u.id}
                        className="p-3 rounded-lg bg-[var(--color-secondary)] border border-[var(--color-border)]"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary">#{i + 1}</Badge>
                          <span className="font-medium text-sm">
                            {u.recommendedPart}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--color-muted-foreground)]">
                          Replace {u.currentPart} • Cost:{" "}
                          {formatCurrency(u.upgradeCost)} • Resale +$
                          {u.resaleIncreaseMin}–${u.resaleIncreaseMax} • Profit
                          +${u.additionalProfitMin}–${u.additionalProfitMax}
                        </p>
                        <p className="text-xs mt-1">{u.reason}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <CardTitle>Reseller Recommendation</CardTitle>
                    <VerdictBadge verdict={recommendation.verdict} />
                  </div>
                </CardHeader>
                <ul className="space-y-1 mb-4">
                  {recommendation.reasons.map((r, i) => (
                    <li key={i} className="text-sm">
                      • {r}
                    </li>
                  ))}
                </ul>
                <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                  <div>
                    <p className="text-[var(--color-muted-foreground)]">
                      Max Purchase
                    </p>
                    <p className="font-bold">
                      {formatCurrency(recommendation.suggestedPurchasePrice)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[var(--color-muted-foreground)]">
                      Target Resale
                    </p>
                    <p className="font-bold">
                      {formatCurrency(recommendation.targetResaleMin)}–
                      {formatCurrency(recommendation.targetResaleMax)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[var(--color-muted-foreground)]">
                      Est. Profit
                    </p>
                    <p className="font-bold text-green-400">
                      {formatCurrency(recommendation.estimatedProfitMin)}–
                      {formatCurrency(recommendation.estimatedProfitMax)}
                    </p>
                  </div>
                </div>
              </Card>

              <div>
                <h2 className="text-lg font-semibold mb-3">
                  Compatibility Details
                </h2>
                <CompatibilityResults results={compat.results} />
              </div>
            </>
          )}

          {entries.length === 0 && (
            <Card>
              <p className="text-[var(--color-muted-foreground)]">
                Select components on the left to start analyzing your build.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
