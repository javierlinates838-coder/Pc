"use client";

import { useMemo, useState } from "react";
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
  Zap,
  TrendingUp,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/layout/page-header";
import { WorkflowGuide } from "@/components/layout/workflow-guide";
import { BeatBuildCoresCard } from "@/components/layout/beat-buildcores";

export default function DashboardPage() {
  const router = useRouter();
  const { currentBuild, buildName, flipCosts } = useBuildStore();
  const stats = useInventoryStats();
  const [statsOpen, setStatsOpen] = useState(false);
  const [quickPaste, setQuickPaste] = useState("");

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

  const handleQuickDeal = () => {
    if (quickPaste.trim()) {
      sessionStorage.setItem("pcflip-quick-listing", quickPaste.trim());
    }
    router.push("/deal");
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="glass-panel relative overflow-hidden rounded-2xl p-5 sm:p-8 neon-border">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/15 via-transparent to-purple-600/10"
          aria-hidden
        />
        <div className="relative space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-primary)]">
            <Zap className="h-3.5 w-3.5" />
            PC flipping command center
          </div>
          <h1 className="text-2xl font-bold leading-tight sm:text-3xl lg:text-4xl">
            <span className="text-gradient">Flip smarter.</span>
            <br />
            <span className="text-[var(--color-foreground)]">
              Paste. Price. Profit.
            </span>
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-[var(--color-muted-foreground)]">
            The only toolkit built for PC resellers — live deal parsing, 3D rig
            builder, 12-platform profit math, and flip inventory in one flow.
          </p>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-secondary)]/40 p-3 text-center">
              <p className="metric-hero text-lg font-bold text-[var(--color-primary)] sm:text-xl">
                205+
              </p>
              <p className="text-[9px] uppercase tracking-wide text-[var(--color-muted-foreground)]">
                Parts
              </p>
            </div>
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-secondary)]/40 p-3 text-center">
              <p className="metric-hero text-lg font-bold text-[var(--color-primary)] sm:text-xl">
                12
              </p>
              <p className="text-[9px] uppercase tracking-wide text-[var(--color-muted-foreground)]">
                Platforms
              </p>
            </div>
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-secondary)]/40 p-3 text-center">
              <p className="metric-hero text-lg font-bold text-[var(--color-primary)] sm:text-xl">
                3D
              </p>
              <p className="text-[9px] uppercase tracking-wide text-[var(--color-muted-foreground)]">
                Visualizer
              </p>
            </div>
          </div>
        </div>
      </section>

      <Card className="neon-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <GitBranch className="h-4 w-4 text-[var(--color-primary)]" />
            Quick deal paste
          </CardTitle>
          <CardDescription>
            Drop a listing here — we&apos;ll carry it to the deal scanner.
          </CardDescription>
        </CardHeader>
        <Textarea
          value={quickPaste}
          onChange={(e) => setQuickPaste(e.target.value)}
          rows={4}
          placeholder="Paste a Facebook / eBay ad with price and specs…"
          className="font-mono text-xs"
        />
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Button onClick={handleQuickDeal} className="w-full sm:w-auto" disabled={!quickPaste.trim()}>
            <TrendingUp className="mr-1.5 h-4 w-4" />
            Analyze this deal
          </Button>
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => router.push("/build")}
          >
            <Cpu className="mr-1.5 h-4 w-4" />
            Build from scratch
          </Button>
        </div>
      </Card>

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
            Paste the ad — parts, price, and profit live
          </span>
        </Button>
        <Button
          variant="outline"
          className="h-auto min-h-[4.5rem] flex-col items-start gap-1 py-4 text-left"
          onClick={() => router.push("/build")}
        >
          <span className="flex items-center gap-2 text-sm font-bold">
            <Layers className="h-4 w-4" />
            I&apos;m building a PC myself
          </span>
          <span className="text-xs text-[var(--color-muted-foreground)]">
            Pick parts manually and see the 3D rig
          </span>
        </Button>
      </div>

      {partCount > 0 && (
        <Card className="border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 neon-border">
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

      <WorkflowGuide />

      <BeatBuildCoresCard />

      <div className="glass-panel rounded-2xl">
        <button
          type="button"
          onClick={() => setStatsOpen(!statsOpen)}
          className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
        >
          <div>
            <p className="text-sm font-semibold">Business stats</p>
            <p className="text-[10px] text-[var(--color-muted-foreground)]">
              {stats.totalPCs} saved flips · expand to track your business
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
              <p className="metric-hero text-xl font-bold">{stats.totalPCs}</p>
              <p className="text-[10px] text-[var(--color-muted-foreground)]">
                Saved flips
              </p>
            </div>
            <div className="rounded-xl bg-[var(--color-secondary)]/50 p-3 text-center">
              <p className="metric-hero text-xl font-bold">
                {formatCurrency(stats.totalInvested)}
              </p>
              <p className="text-[10px] text-[var(--color-muted-foreground)]">
                Invested
              </p>
            </div>
            <div className="rounded-xl bg-[var(--color-secondary)]/50 p-3 text-center">
              <p className="metric-hero text-xl font-bold text-[var(--color-success)]">
                {formatCurrency(stats.totalEstimatedProfit)}
              </p>
              <p className="text-[10px] text-[var(--color-muted-foreground)]">
                Est. profit
              </p>
            </div>
            <div className="rounded-xl bg-[var(--color-secondary)]/50 p-3 text-center">
              <p className="metric-hero text-xl font-bold">
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
