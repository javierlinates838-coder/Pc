"use client";

import { useMemo } from "react";
import { useBuildStore, useInventoryStore } from "@/lib/inventory/store";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { getPartCount } from "@/lib/build/helpers";
import { analyzeCompatibility } from "@/lib/compatibility/engine";
import { componentMapToEntries } from "@/lib/build/helpers";
import { estimateCompletePcValue } from "@/lib/pricing/estimator";
import { calculateBuildQualityScore } from "@/lib/reseller/analyzer";
import {
  Package,
  DollarSign,
  TrendingUp,
  Cpu,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { currentBuild } = useBuildStore();
  const stats = useInventoryStore((s) => s.getStats());

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
    () => estimateCompletePcValue(entries),
    [entries]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-[var(--color-muted-foreground)] mt-1">
          Overview of your PC flipping business
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-400" />
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
              <Link href="/build">
                <Button variant="outline" size="sm">
                  Open Build Analyzer <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          ) : (
            <Link href="/build">
              <Button>Start New Build</Button>
            </Link>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common reseller workflows</CardDescription>
          </CardHeader>
          <div className="grid grid-cols-2 gap-2">
            <Link href="/deal">
              <Button variant="outline" className="w-full justify-start">
                Analyze a Deal
              </Button>
            </Link>
            <Link href="/scanner">
              <Button variant="outline" className="w-full justify-start">
                Scan a Part
              </Button>
            </Link>
            <Link href="/profit">
              <Button variant="outline" className="w-full justify-start">
                Calculate Profit
              </Button>
            </Link>
            <Link href="/inventory">
              <Button variant="outline" className="w-full justify-start">
                View Inventory
              </Button>
            </Link>
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
