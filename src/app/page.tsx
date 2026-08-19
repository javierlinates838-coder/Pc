"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useBuildStore } from "@/lib/inventory/store";
import { useInventoryStats } from "@/lib/inventory/use-inventory-stats";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { getPartCount } from "@/lib/build/helpers";
import { analyzeCompatibility } from "@/lib/compatibility/engine";
import { componentMapToEntries } from "@/lib/build/helpers";
import { estimateFlipResale } from "@/lib/flip/resale";
import { calculateBuildQualityScore } from "@/lib/reseller/analyzer";
import {
  Package,
  DollarSign,
  TrendingUp,
  Cpu,
  ArrowRight,
  Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { getDatabaseStats } from "@/lib/database";

export default function DashboardPage() {
  const router = useRouter();
  const { currentBuild, savedBuilds, loadSavedBuild } = useBuildStore();
  const stats = useInventoryStats();
  const dbStats = getDatabaseStats();

  const partCount = getPartCount(currentBuild);
  const compat = useMemo(
    () => analyzeCompatibility(currentBuild),
    [currentBuild]
  );
  const quality = useMemo(
    () => calculateBuildQualityScore(currentBuild),
    [currentBuild]
  );
  const entries = useMemo(
    () => componentMapToEntries(currentBuild),
    [currentBuild]
  );
  const value = useMemo(
    () =>
      entries.length > 0
        ? estimateFlipResale(entries)
        : { min: 0, max: 0, mid: 0, marketMid: 0 },
    [entries]
  );

  const openSavedBuild = (id: string) => {
    loadSavedBuild(id);
    router.push("/build");
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Overview of your PC flipping business · ${dbStats.total} parts in database`}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--color-primary)]/20 flex items-center justify-center">
              <Package className="w-5 h-5 text-[var(--color-primary)]" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalPCs}</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Total PCs in Inventory
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {formatCurrency(stats.totalInvested)}
              </p>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Total Invested
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {formatCurrency(stats.totalEstimatedProfit)}
              </p>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Est. Total Profit
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {stats.averageROI > 0 ? `${stats.averageROI.toFixed(1)}%` : "—"}
              </p>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Average ROI
              </p>
            </div>
          </div>
        </Card>
      </div>

      {savedBuilds.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Saved builds</CardTitle>
            <CardDescription>
              {savedBuilds.length} rig(s) saved locally — open in 3D builder
            </CardDescription>
          </CardHeader>
          <div className="flex flex-wrap gap-2">
            {savedBuilds.map((b) => (
              <Button
                key={b.id}
                variant="outline"
                size="sm"
                onClick={() => openSavedBuild(b.id)}
              >
                {b.name}
              </Button>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Current Build</CardTitle>
            <CardDescription>
              {partCount > 0
                ? `${partCount} parts selected`
                : "No parts selected yet"}
            </CardDescription>
          </CardHeader>
          {partCount > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant={
                    compat.overallStatus === "compatible"
                      ? "success"
                      : compat.overallStatus === "warning"
                        ? "warning"
                        : "destructive"
                  }
                >
                  {compat.overallStatus.toUpperCase()}
                </Badge>
                <Badge variant="secondary">
                  Quality: {quality.total}/100
                </Badge>
                <Badge variant="secondary">
                  Value: {formatCurrency(value.min)}–{formatCurrency(value.max)}
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/build")}
              >
                Open Build Analyzer <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button onClick={() => router.push("/build")}>
              Start New Build
            </Button>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common reseller workflows</CardDescription>
          </CardHeader>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-2">
            <Button
              variant="outline"
              className="h-11 w-full justify-start text-left"
              onClick={() => router.push("/deal")}
            >
              Analyze a Deal
            </Button>
            <Button
              variant="outline"
              className="h-11 w-full justify-start text-left"
              onClick={() => router.push("/scanner")}
            >
              Scan a Part
            </Button>
            <Button
              variant="outline"
              className="h-11 w-full justify-start text-left"
              onClick={() => router.push("/profit")}
            >
              Calculate Profit
            </Button>
            <Button
              variant="outline"
              className="h-11 w-full justify-start text-left"
              onClick={() => router.push("/inventory")}
            >
              View Inventory
            </Button>
            <Button
              variant="outline"
              className="h-11 w-full justify-start text-left"
              onClick={() => router.push("/database")}
            >
              <Database className="mr-2 h-4 w-4 shrink-0" />
              Browse {dbStats.total} Parts
            </Button>
          </div>
        </Card>
      </div>

      {stats.bestFlip && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-green-400">Best Flip</CardTitle>
            </CardHeader>
            <p className="font-medium">{stats.bestFlip.name}</p>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Target: {formatCurrency(stats.bestFlip.costs.targetSellingPrice)}
            </p>
          </Card>
          {stats.worstFlip && stats.worstFlip.id !== stats.bestFlip.id && (
            <Card>
              <CardHeader>
                <CardTitle className="text-red-400">Needs Attention</CardTitle>
              </CardHeader>
              <p className="font-medium">{stats.worstFlip.name}</p>
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Review pricing and upgrades
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
