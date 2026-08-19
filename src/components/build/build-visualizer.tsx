"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import type { VisualizerSceneData } from "@/lib/build/visualizer-scene";
import { BuildVisualizerPlan } from "./build-visualizer-plan";
import { VisualizerPartChips } from "./visualizer-part-chips";

const BuildVisualizer3D = dynamic(
  () =>
    import("./build-visualizer-3d").then((m) => m.BuildVisualizer3D),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-xs text-[var(--color-muted-foreground)]">
        Loading 3D rig…
      </div>
    ),
  }
);

interface BuildVisualizerProps {
  scene: VisualizerSceneData;
  hasParts: boolean;
}

export function BuildVisualizer({ scene, hasParts }: BuildVisualizerProps) {
  const [mode, setMode] = useState<"3d" | "plan">("3d");
  const [rgbPreview, setRgbPreview] = useState(true);

  const clearanceHint = useMemo(() => {
    if (!scene.clearanceGpuMm && !scene.clearanceCoolerMm) return null;
    const parts: string[] = [];
    if (scene.clearanceGpuMm) parts.push(`GPU ≤${scene.clearanceGpuMm}mm`);
    if (scene.clearanceCoolerMm) parts.push(`Cooler ≤${scene.clearanceCoolerMm}mm`);
    return parts.join(" · ");
  }, [scene]);

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-[0_0_40px_rgba(255,77,157,0.12)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border)] px-3 py-2 sm:px-4">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-primary)]">
            3D interior
          </p>
          <p className="text-[10px] leading-snug text-[var(--color-muted-foreground)]">
            <span className="block truncate">{scene.caseLabel}</span>
            {scene.boardLabel !== "NO BOARD" && (
              <span className="block truncate">{scene.boardLabel}</span>
            )}
            {clearanceHint && (
              <span className="block truncate text-[9px]">{clearanceHint}</span>
            )}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          {scene.hasRgb && (
            <button
              type="button"
              onClick={() => setRgbPreview(!rgbPreview)}
              className={cn(
                "rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide transition-colors",
                rgbPreview
                  ? "bg-[var(--color-primary)] text-white"
                  : "border border-[var(--color-border)] text-[var(--color-muted-foreground)]"
              )}
            >
              RGB
            </button>
          )}
          <div className="flex rounded-full border border-[var(--color-border)] bg-[var(--color-secondary)]/60 p-0.5">
            <button
              type="button"
              onClick={() => setMode("3d")}
              className={cn(
                "rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide transition-colors",
                mode === "3d"
                  ? "bg-[var(--color-primary)] text-white"
                  : "text-[var(--color-muted-foreground)]"
              )}
            >
              3D
            </button>
            <button
              type="button"
              onClick={() => setMode("plan")}
              className={cn(
                "rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide transition-colors",
                mode === "plan"
                  ? "bg-[var(--color-primary)] text-white"
                  : "text-[var(--color-muted-foreground)]"
              )}
            >
              Plan
            </button>
          </div>
        </div>
      </div>

      <div className="relative h-[min(42vh,360px)] min-h-[240px] bg-gradient-to-b from-[#0a0610] via-[#0d0614] to-[#120818] sm:h-[min(48vh,420px)] sm:min-h-[280px]">
        {mode === "3d" ? (
          <BuildVisualizer3D
            scene={scene}
            rgbEnabled={rgbPreview}
            rgbHue={0.85}
          />
        ) : (
          <BuildVisualizerPlan
            labels={scene.labels}
            dimensions={scene.dimensions}
            hasParts={hasParts}
          />
        )}
      </div>

      {hasParts && mode === "3d" && <VisualizerPartChips labels={scene.labels} />}
    </div>
  );
}
