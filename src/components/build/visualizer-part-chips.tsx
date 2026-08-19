"use client";

import type { VisualizerLabel } from "@/lib/build/visualizer-labels";

const PRIORITY = ["gpu", "cpu", "mb", "ram", "cooler", "psu", "storage"];

export function VisualizerPartChips({ labels }: { labels: VisualizerLabel[] }) {
  if (labels.length === 0) return null;

  const sorted = [...labels].sort(
    (a, b) => PRIORITY.indexOf(a.id) - PRIORITY.indexOf(b.id)
  );

  return (
    <div className="border-t border-[var(--color-border)] px-3 py-2.5 sm:px-4">
      <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
        Parts in this view
      </p>
      <div className="flex flex-wrap gap-1.5">
        {sorted.map((label) => (
          <span
            key={label.id}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-secondary)]/50 px-2 py-1 text-[10px] leading-snug"
          >
            <span className="font-semibold text-[var(--color-foreground)]">
              {shortChipText(label.text)}
            </span>
            {label.subtext && (
              <span className="text-[var(--color-muted-foreground)]">
                {" "}
                · {label.subtext}
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

function shortChipText(text: string): string {
  if (text.length <= 28) return text;
  return text.slice(0, 26) + "…";
}
