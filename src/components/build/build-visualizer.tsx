"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { VisualizerMeta } from "@/lib/build/visualizer-labels";
import { BuildVisualizerPlan } from "./build-visualizer-plan";

const BuildVisualizer3D = dynamic(
  () =>
    import("./build-visualizer-3d").then((m) => m.BuildVisualizer3D),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-xs text-[var(--color-muted-foreground)]">
        Loading 3D view…
      </div>
    ),
  }
);

interface BuildVisualizerProps {
  meta: VisualizerMeta;
  hasParts: boolean;
}

export function BuildVisualizer({ meta, hasParts }: BuildVisualizerProps) {
  const [mode, setMode] = useState<"3d" | "plan">("3d");

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-[0_0_30px_rgba(255,77,157,0.08)]">
      <div className="flex items-center justify-between gap-2 border-b border-[var(--color-border)] px-3 py-2 sm:px-4">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-primary)]">
            Side panel off
          </p>
          <p className="truncate text-[10px] text-[var(--color-muted-foreground)]">
            {meta.caseLabel} · {meta.boardLabel}
          </p>
        </div>
        <div className="flex shrink-0 rounded-full border border-[var(--color-border)] bg-[var(--color-secondary)]/60 p-0.5">
          <button
            type="button"
            onClick={() => setMode("3d")}
            className={cn(
              "rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide transition-colors",
              mode === "3d"
                ? "bg-[var(--color-primary)] text-white shadow-[0_0_12px_rgba(255,77,157,0.4)]"
                : "text-[var(--color-muted-foreground)]"
            )}
          >
            3D
          </button>
          <button
            type="button"
            onClick={() => setMode("plan")}
            className={cn(
              "rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide transition-colors",
              mode === "plan"
                ? "bg-[var(--color-primary)] text-white shadow-[0_0_12px_rgba(255,77,157,0.4)]"
                : "text-[var(--color-muted-foreground)]"
            )}
          >
            Plan
          </button>
        </div>
      </div>

      <div className="relative h-[min(52vh,420px)] min-h-[280px] bg-gradient-to-b from-[#0d0614] to-[#120818]">
        {mode === "3d" ? (
          <BuildVisualizer3D labels={meta.labels} hasParts={hasParts} />
        ) : (
          <BuildVisualizerPlan
            labels={meta.labels}
            dimensions={meta.dimensions}
            hasParts={hasParts}
          />
        )}
      </div>
    </div>
  );
}
