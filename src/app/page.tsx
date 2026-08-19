"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useBuildStore } from "@/lib/inventory/store";
import { useInventoryStats } from "@/lib/inventory/use-inventory-stats";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { getPartCount, componentMapToEntries } from "@/lib/build/helpers";
import { estimateFlipResale } from "@/lib/flip/resale";
import {
  GitBranch,
  Cpu,
  Tag,
  BarChart3,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { WorkflowGuide } from "@/components/layout/workflow-guide";
import { useState } from "react";

export default function DashboardPage() {
  const router = useRouter();
  const { currentBuild, buildName, flipCosts } = useBuildStore();
  const stats = useInventoryStats();
  const [statsOpen, setStatsOpen] = useState(false);

  const partCount = getPartCount(currentBuild);
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

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="PC Flip Pro"
        description="Buy low, sell high — this app walks you through each flip in order."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Button
          className="h-auto min-h-[4.5rem] flex-col items-start gap-1 py-4 text-left"
          onClick={() => router.push("/deal")}
        >
          <span className="flex items-center gap-2 text-sm font-bold">
            <GitBranch className="h-4 w-4" />
            I found a listing online
          </span>
          <span className="text-xs opacity-90">
            Paste the ad — we check parts, price, and profit
          </span>
        </Button>
        <Button
          variant="outline"
          className="h-auto min-h-[4.5rem] flex-col items-start gap-1 py-4 text-left"
          onClick={() => router.push("/build")}
        >
          <span className="flex items-center gap-2 text-sm font-bold">
            <Cpu className="h-4 w-4" />
            I&apos;m building a PC myself
          </span>
          <span className="text-xs text-[var(--color-muted-foreground)]">
            Pick parts manually and see the 3D rig
          </span>
        </Button>
      </div>

      <WorkflowGuide />

      {partCount > 0 && (
        <Card className="border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5">
          <CardHeader>
            <CardTitle className="text-base">Continue where you left off</CardTitle>
            <CardDescription>
              {buildName} · {partCount} parts
              {flipCosts.purchasePrice > 0 &&
                ` · you paid ${formatCurrency(flipCosts.purchasePrice)}`}
              {value.mid > 0 && ` · list ~${formatCurrency(value.mid)}`}
            </CardDescription>
          </CardHeader>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => router.push("/build")}>
              <Cpu className="mr-1 h-4 w-4" />
              Your PC
            </Button>
            <Button size="sm" variant="outline" onClick={() => router.push("/profit")}>
              <Tag className="mr-1 h-4 w-4" />
              Profit math
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push("/inventory")}
            >
              <BarChart3 className="mr-1 h-4 w-4" />
              My flips
            </Button>
          </div>
        </Card>
      )}

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)]">
        <button
          type="button"
          onClick={() => setStatsOpen(!statsOpen)}
          className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
        >
          <div>
            <p className="text-sm font-semibold">Business stats</p>
            <p className="text-[10px] text-[var(--color-muted-foreground)]">
              {stats.totalPCs} saved flips · optional — expand if you track inventory
            </p>
          </div>
          {statsOpen ? (
            <ChevronUp className="h-5 w-5 text-[var(--color-muted-foreground)]" />
          ) : (
            <ChevronDown className="h-5 w-5 text-[var(--color-muted-foreground)]" />
          )}
        </button>
        {statsOpen && (
          <div className="grid grid-cols-2 gap-3 border-t border-[var(--color-border)] p-4 lg:grid-cols-4">
            <div className="rounded-xl bg-[var(--color-secondary)]/50 p-3 text-center">
              <p className="text-xl font-bold">{stats.totalPCs}</p>
              <p className="text-[10px] text-[var(--color-muted-foreground)]">
                Saved flips
              </p>
            </div>
            <div className="rounded-xl bg-[var(--color-secondary)]/50 p-3 text-center">
              <p className="text-xl font-bold">
                {formatCurrency(stats.totalInvested)}
              </p>
              <p className="text-[10px] text-[var(--color-muted-foreground)]">
                Invested
              </p>
            </div>
            <div className="rounded-xl bg-[var(--color-secondary)]/50 p-3 text-center">
              <p className="text-xl font-bold text-green-400">
                {formatCurrency(stats.totalEstimatedProfit)}
              </p>
              <p className="text-[10px] text-[var(--color-muted-foreground)]">
                Est. profit
              </p>
            </div>
            <div className="rounded-xl bg-[var(--color-secondary)]/50 p-3 text-center">
              <p className="text-xl font-bold">
                {stats.averageROI > 0 ? `${stats.averageROI.toFixed(0)}%` : "—"}
              </p>
              <p className="text-[10px] text-[var(--color-muted-foreground)]">
                Avg ROI
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
