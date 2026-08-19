"use client";

import type { VisualizerLabel } from "@/lib/build/visualizer-labels";

interface BuildVisualizerPlanProps {
  labels: VisualizerLabel[];
  dimensions: string;
  hasParts: boolean;
}

const PLAN_ZONES: Record<string, { className: string; title: string }> = {
  mb: { className: "left-[18%] top-[32%] w-[42%] h-[28%]", title: "Motherboard" },
  gpu: { className: "left-[28%] top-[38%] w-[48%] h-[14%]", title: "GPU" },
  cooler: { className: "left-[32%] top-[18%] w-[22%] h-[18%]", title: "Cooler" },
  psu: { className: "right-[8%] bottom-[12%] w-[22%] h-[22%]", title: "PSU" },
  ram: { className: "left-[24%] top-[42%] w-[18%] h-[10%]", title: "RAM" },
  cpu: { className: "left-[34%] top-[40%] w-[14%] h-[12%]", title: "CPU" },
  storage: { className: "left-[12%] top-[28%] w-[16%] h-[8%]", title: "Storage" },
};

export function BuildVisualizerPlan({
  labels,
  dimensions,
  hasParts,
}: BuildVisualizerPlanProps) {
  const labelMap = new Map(labels.map((l) => [l.id, l]));

  return (
    <div className="relative h-full w-full p-4">
      {/* Case outline */}
      <div
        className="absolute inset-4 rounded-lg border-2 border-dashed border-[var(--color-primary)]/50 bg-[var(--color-primary)]/[0.03] shadow-[inset_0_0_40px_rgba(255,77,157,0.06)]"
      >
        <div className="absolute left-3 top-3 text-[10px] font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
          Plan view
        </div>
        <div className="absolute bottom-3 left-3 text-[10px] text-[var(--color-muted-foreground)]">
          {dimensions}
        </div>

        {!hasParts && (
          <div className="flex h-full items-center justify-center text-sm text-[var(--color-muted-foreground)]">
            Add parts to see layout
          </div>
        )}

        {labels.map((label) => {
          const zone = PLAN_ZONES[label.id];
          if (!zone) return null;
          return (
            <div
              key={label.id}
              className={`absolute flex flex-col items-center justify-center rounded border border-[var(--color-primary)]/60 bg-[#1a0a24]/80 px-1 py-1 text-center shadow-[0_0_10px_rgba(255,77,157,0.15)] ${zone.className}`}
            >
              <span className="text-[9px] font-semibold leading-tight text-white">
                {label.text}
              </span>
              {label.subtext && (
                <span className="text-[8px] text-[var(--color-accent-foreground)]">
                  {label.subtext}
                </span>
              )}
            </div>
          );
        })}

        {/* Extra labels without fixed zones */}
        {labels
          .filter((l) => !PLAN_ZONES[l.id])
          .map((label, i) => (
            <div
              key={label.id}
              className="absolute rounded border border-[var(--color-primary)]/40 bg-[#1a0a24]/90 px-2 py-1 text-[9px] text-white"
              style={{ left: `${10 + i * 12}%`, top: `${8 + i * 5}%` }}
            >
              {label.text}
            </div>
          ))}
      </div>

      {/* Legend */}
      {hasParts && (
        <div className="absolute bottom-2 right-4 flex flex-wrap gap-1 max-w-[50%]">
          {labels.slice(0, 4).map((l) => (
            <span
              key={l.id}
              className="rounded-full bg-[var(--color-secondary)] px-2 py-0.5 text-[8px] text-[var(--color-muted-foreground)]"
            >
              {labelMap.get(l.id)?.text ?? l.text}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
