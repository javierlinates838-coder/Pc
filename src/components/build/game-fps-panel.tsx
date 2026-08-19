"use client";

import type { GPU } from "@/lib/types/components";
import { estimateGameFps } from "@/lib/performance/game-fps";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface GameFpsPanelProps {
  gpu?: GPU;
}

export function GameFpsPanel({ gpu }: GameFpsPanelProps) {
  if (!gpu) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">Game FPS estimates</CardTitle>
          <CardDescription>
            Add a GPU to see estimated FPS — BuildCores-style, tuned for flip listings.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const estimates = estimateGameFps(gpu.performanceTier);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-base">Game FPS estimates</CardTitle>
          <Badge variant="secondary">{gpu.name}</Badge>
        </div>
        <CardDescription>
          Estimated 1080p / 1440p FPS for buyers — tier-based, not live benchmarks.
        </CardDescription>
      </CardHeader>
      <div className="table-scroll">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-left text-xs text-[var(--color-muted-foreground)]">
              <th className="py-2 pr-2">Game</th>
              <th className="py-2 text-right">1080p</th>
              <th className="py-2 text-right">1440p</th>
              <th className="py-2 pl-2 text-right">Settings</th>
            </tr>
          </thead>
          <tbody>
            {estimates.map((row) => (
              <tr
                key={row.game}
                className="border-b border-[var(--color-border)]/40"
              >
                <td className="py-2 pr-2 font-medium">{row.game}</td>
                <td className="py-2 text-right tabular-nums text-[var(--color-success)]">
                  {row.fps1080p}
                </td>
                <td className="py-2 text-right tabular-nums">
                  {row.fps1440p}
                </td>
                <td className="py-2 pl-2 text-right text-xs text-[var(--color-muted-foreground)]">
                  {row.settings}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
