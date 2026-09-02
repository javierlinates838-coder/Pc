"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useBuildStore, useSettingsStore } from "@/lib/inventory/store";
import { PartSelector } from "@/components/build/part-selector";
import {
  CompatibilityResults,
  CompatibilitySummary,
} from "@/components/build/compatibility-results";
import { BuildRigHeader } from "@/components/build/build-rig-header";
import { BuildVisualizer } from "@/components/build/build-visualizer";
import { BuildFinancialBar } from "@/components/build/build-financial-bar";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { analyzeCompatibility } from "@/lib/compatibility/engine";
import {
  calculateBuildQualityScore,
  estimatePerformance,
  generateResellerRecommendation,
  getUpgradeRecommendations,
} from "@/lib/reseller/analyzer";
import { componentMapToEntries, getPartCount } from "@/lib/build/helpers";
import { getBuildFinancialSummary } from "@/lib/build/financial-summary";
import { getVisualizerSceneData } from "@/lib/build/visualizer-scene";
import { GameFpsPanel } from "@/components/build/game-fps-panel";
import { BuildExportPanel } from "@/components/build/build-export-panel";
import {
  compareValueStrategies,
  estimatePartValue,
} from "@/lib/pricing/estimator";
import { formatCurrency } from "@/lib/utils";
import { VerdictBadge } from "@/components/ui/status-badge";
import { Select } from "@/components/ui/select";
import type { Condition } from "@/lib/types/components";

const CONDITION_OPTIONS: { value: Condition; label: string }[] = [
  { value: "new", label: "New" },
  { value: "like-new", label: "Like new" },
  { value: "used", label: "Used" },
  { value: "fair", label: "Fair" },
  { value: "parts", label: "Parts / not working" },
];

export default function BuildAnalyzerPage() {
  const router = useRouter();
  const {
    currentBuild,
    conditions,
    buildName,
    setBuildName,
    saveCurrentBuild,
    flipCosts,
    setAllConditions,
    activeInventoryId,
    updateActiveInventory,
  } = useBuildStore();
  const { defaultShippingCost } = useSettingsStore();
  const [partsOpen, setPartsOpen] = useState(true);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [inventoryMessage, setInventoryMessage] = useState<string | null>(null);

  const partCount = getPartCount(currentBuild);
  const entries = useMemo(
    () => componentMapToEntries(currentBuild, conditions),
    [currentBuild, conditions]
  );
  const hasParts = entries.length > 0;

  const visualizerScene = useMemo(
    () => getVisualizerSceneData(currentBuild),
    [currentBuild]
  );

  const financials = useMemo(
    () => getBuildFinancialSummary(entries, defaultShippingCost, flipCosts),
    [entries, defaultShippingCost, flipCosts]
  );

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
  const strategy = useMemo(
    () => compareValueStrategies(entries),
    [entries]
  );
  const upgrades = useMemo(
    () => getUpgradeRecommendations(currentBuild),
    [currentBuild]
  );
  const recommendation = useMemo(
    () => generateResellerRecommendation(currentBuild, flipCosts.purchasePrice),
    [currentBuild, flipCosts.purchasePrice]
  );

  const overallCondition =
    entries[0]?.condition ?? ("used" as Condition);

  const handleSave = () => {
    const ok = saveCurrentBuild();
    if (!ok) {
      setSaveMessage("Add at least one part before saving.");
    } else {
      setSaveMessage("Build saved on this device.");
    }
    setTimeout(() => setSaveMessage(null), 2500);
  };

  const handleUpdateInventory = () => {
    const ok = updateActiveInventory();
    setInventoryMessage(
      ok ? "Inventory updated with current parts and costs." : "No linked inventory PC to update."
    );
    setTimeout(() => setInventoryMessage(null), 2500);
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <BuildRigHeader
        buildName={buildName}
        onNameChange={setBuildName}
        onSave={handleSave}
      />
      {saveMessage && (
        <p className="text-center text-xs text-[var(--color-primary)]">
          {saveMessage}
        </p>
      )}
      {inventoryMessage && (
        <p className="text-center text-xs text-[var(--color-success)]">
          {inventoryMessage}
        </p>
      )}

      <div className="lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-start lg:gap-6">
        <div className="space-y-4 sm:space-y-5">
          {hasParts && (
            <div className="flex flex-wrap items-center gap-2 lg:hidden">
              <label className="text-xs text-[var(--color-muted-foreground)]">
                Condition
              </label>
              <Select
                value={overallCondition}
                onChange={(e) => setAllConditions(e.target.value as Condition)}
                className="h-9 w-auto min-w-[120px] text-xs"
              >
                {CONDITION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
              {activeInventoryId && (
                <Badge variant="secondary">Linked to inventory</Badge>
              )}
              {activeInventoryId && (
                <Button variant="outline" size="sm" onClick={handleUpdateInventory}>
                  Update inventory
                </Button>
              )}
            </div>
          )}

          <BuildVisualizer scene={visualizerScene} hasParts={hasParts} />

          {hasParts && (
            <BuildFinancialBar
              partsTotal={financials.partsTotal}
              costTotal={financials.costTotal}
              listPrice={financials.listPrice}
              profit={financials.profit}
              purchasePrice={financials.purchasePrice}
              netProfitAfterFees={financials.netProfitAfterFees}
              bestPlatformName={financials.bestPlatformName}
            />
          )}

          {hasParts && (
            <>
              <CompatibilitySummary
                compatibleCount={compat.compatibleCount}
                warningCount={compat.warningCount}
                incompatibleCount={compat.incompatibleCount}
                overallStatus={compat.overallStatus}
              />

              <Card className="border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5">
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-base">Quick read</CardTitle>
                    <VerdictBadge verdict={recommendation.verdict} />
                  </div>
                  <CardDescription>
                    Quality {quality.total}/100 · List est.{" "}
                    {formatCurrency(financials.listPrice)}
                    {financials.netProfitAfterFees !== null
                      ? ` · Profit ${formatCurrency(financials.netProfitAfterFees)} after fees`
                      : ` · Parts margin ${formatCurrency(financials.profit)}`}
                  </CardDescription>
                </CardHeader>
              </Card>

              <GameFpsPanel gpu={currentBuild.gpu} />

              <BuildExportPanel
                build={currentBuild}
                buildName={buildName}
                listPrice={financials.listPrice}
                purchasePrice={flipCosts.purchasePrice}
                profit={financials.netProfitAfterFees ?? financials.profit}
              />
            </>
          )}

          {!hasParts && (
            <Card className="border-dashed border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 lg:hidden">
              <p className="text-center text-sm text-[var(--color-muted-foreground)]">
                Pick parts on the right to see your 3D rig come alive.
              </p>
            </Card>
          )}
        </div>

        <div className="mt-4 space-y-4 lg:mt-0 lg:sticky lg:top-4">
          {hasParts && (
            <div className="hidden flex-wrap items-center gap-2 lg:flex">
              <label className="text-xs text-[var(--color-muted-foreground)]">
                Condition
              </label>
              <Select
                value={overallCondition}
                onChange={(e) => setAllConditions(e.target.value as Condition)}
                className="h-9 w-auto min-w-[120px] text-xs"
              >
                {CONDITION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
              {activeInventoryId && (
                <Badge variant="secondary">Linked to inventory</Badge>
              )}
              {activeInventoryId && (
                <Button variant="outline" size="sm" onClick={handleUpdateInventory}>
                  Update inventory
                </Button>
              )}
            </div>
          )}

          <div className="glass-panel rounded-2xl lg:max-h-[calc(100dvh-8rem)] lg:overflow-y-auto">
            <button
              type="button"
              onClick={() => setPartsOpen(!partsOpen)}
              className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left lg:cursor-default"
            >
              <div>
                <p className="text-sm font-semibold">Components</p>
                <p className="text-[10px] text-[var(--color-muted-foreground)]">
                  {partCount > 0
                    ? `${partCount} parts selected`
                    : "Add CPU, GPU, board…"}
                </p>
              </div>
              <span className="lg:hidden">
                {partsOpen ? (
                  <ChevronUp className="h-5 w-5 text-[var(--color-muted-foreground)]" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-[var(--color-muted-foreground)]" />
                )}
              </span>
            </button>
            <div
              className={`border-t border-[var(--color-border)] px-4 pb-4 pt-3 ${!partsOpen ? "max-lg:hidden" : ""}`}
            >
              <PartSelector />
            </div>
          </div>

          {hasParts && (
            <div className="hidden lg:block">
              <Button className="w-full" onClick={() => router.push("/profit")}>
                Run profit math →
              </Button>
            </div>
          )}
        </div>
      </div>

      {hasParts && (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)]">
            <button
              type="button"
              onClick={() => setAnalysisOpen(!analysisOpen)}
              className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
            >
              <div>
                <p className="text-sm font-semibold">Detailed analysis</p>
                <p className="text-[10px] text-[var(--color-muted-foreground)]">
                  Part values, upgrades, compatibility details
                </p>
              </div>
              {analysisOpen ? (
                <ChevronUp className="h-5 w-5 shrink-0 text-[var(--color-muted-foreground)]" />
              ) : (
                <ChevronDown className="h-5 w-5 shrink-0 text-[var(--color-muted-foreground)]" />
              )}
            </button>

            {analysisOpen && (
              <div className="space-y-4 border-t border-[var(--color-border)] p-4">
                <Card className="border-0 bg-[var(--color-secondary)]/40 shadow-none">
                  <CardHeader>
                    <CardTitle className="text-base">Build quality</CardTitle>
                    <CardDescription>
                      Performance, balance, upgradeability, resale appeal
                    </CardDescription>
                  </CardHeader>
                  <div className="flex items-center gap-4">
                    <div
                      className="text-3xl font-bold text-[var(--color-primary)]"
                    >
                      {quality.total}
                    </div>
                    <div className="flex-1">
                      <div className="h-2.5 overflow-hidden rounded-full bg-[var(--color-secondary)]">
                        <div
                          className="h-full rounded-full bg-[var(--color-primary)] transition-all shadow-[0_0_8px_rgba(255,77,157,0.5)]"
                          style={{ width: `${quality.total}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="border-0 bg-[var(--color-secondary)]/40 shadow-none">
                  <CardHeader>
                    <CardTitle className="text-base">Part values</CardTitle>
                  </CardHeader>
                  <div className="table-scroll">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[var(--color-border)]">
                          <th className="py-2 text-left font-medium">Part</th>
                          <th className="py-2 text-right font-medium">Used</th>
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
                              className="border-b border-[var(--color-border)]/40"
                            >
                              <td className="py-2 pr-2">{entry.component.name}</td>
                              <td className="py-2 text-right tabular-nums text-[var(--color-muted-foreground)]">
                                {formatCurrency(val.mid)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>

                <Card className="border-0 bg-[var(--color-secondary)]/40 shadow-none">
                  <CardHeader>
                    <CardTitle className="text-base">
                      Part-out vs complete PC
                    </CardTitle>
                  </CardHeader>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-[var(--color-background)]/50 p-3">
                      <p className="text-[10px] uppercase tracking-wide text-[var(--color-muted-foreground)]">
                        Part-out
                      </p>
                      <p className="mt-1 font-bold tabular-nums">
                        {formatCurrency(strategy.partOutValueMin)}–
                        {formatCurrency(strategy.partOutValueMax)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-[var(--color-background)]/50 p-3">
                      <p className="text-[10px] uppercase tracking-wide text-[var(--color-muted-foreground)]">
                        Complete PC
                      </p>
                      <p className="mt-1 font-bold tabular-nums">
                        {formatCurrency(strategy.completePcValueMin)}–
                        {formatCurrency(strategy.completePcValueMax)}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="border-0 bg-[var(--color-secondary)]/40 shadow-none">
                  <CardHeader>
                    <CardTitle className="text-base">Performance</CardTitle>
                    <CardDescription>{performance.disclaimer}</CardDescription>
                  </CardHeader>
                  <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                    <div>1080p: {performance.gaming1080p}</div>
                    <div>1440p: {performance.gaming1440p}</div>
                    <div>Productivity: {performance.productivity}</div>
                    <div>Streaming: {performance.streaming}</div>
                  </div>
                </Card>

                {upgrades.length > 0 && (
                  <Card className="border-0 bg-[var(--color-secondary)]/40 shadow-none">
                    <CardHeader>
                      <CardTitle className="text-base">Upgrades</CardTitle>
                    </CardHeader>
                    <div className="space-y-2">
                      {upgrades.slice(0, 3).map((u, i) => (
                        <div
                          key={u.id}
                          className="rounded-xl border border-[var(--color-border)]/60 bg-[var(--color-background)]/40 p-3 text-xs"
                        >
                          <Badge variant="secondary" className="mb-1">
                            #{i + 1}
                          </Badge>
                          <p className="font-medium">{u.recommendedPart}</p>
                          <p className="text-[var(--color-muted-foreground)]">
                            +${u.additionalProfitMin}–${u.additionalProfitMax}{" "}
                            profit
                          </p>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                <Card className="border-0 bg-[var(--color-secondary)]/40 shadow-none">
                  <CardHeader>
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-base">Reseller verdict</CardTitle>
                      <VerdictBadge verdict={recommendation.verdict} />
                    </div>
                  </CardHeader>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs sm:text-sm">
                    <div>
                      <p className="text-[var(--color-muted-foreground)]">Max buy</p>
                      <p className="font-bold tabular-nums">
                        {formatCurrency(recommendation.suggestedPurchasePrice)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[var(--color-muted-foreground)]">Target</p>
                      <p className="font-bold tabular-nums text-[var(--color-primary)]">
                        {formatCurrency(
                          Math.round(
                            (recommendation.targetResaleMin +
                              recommendation.targetResaleMax) /
                              2
                          )
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-[var(--color-muted-foreground)]">Profit</p>
                      <p className="font-bold tabular-nums text-[var(--color-success)]">
                        {formatCurrency(recommendation.estimatedProfitMin)}–
                        {formatCurrency(recommendation.estimatedProfitMax)}
                      </p>
                    </div>
                  </div>
                </Card>

                <CompatibilityResults results={compat.results} />
              </div>
            )}
          </div>
      )}

      {!hasParts && (
        <Card className="border-dashed border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 lg:hidden">
          <p className="text-center text-sm text-[var(--color-muted-foreground)]">
            Open <strong className="text-[var(--color-foreground)]">Components</strong>{" "}
            above to start building. The 3D view updates as you add parts.
          </p>
          <Button
            className="mt-3 w-full"
            onClick={() => setPartsOpen(true)}
          >
            Add parts
          </Button>
        </Card>
      )}
    </div>
  );
}
