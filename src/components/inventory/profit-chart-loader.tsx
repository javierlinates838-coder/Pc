"use client";

import dynamic from "next/dynamic";

export const ProfitChart = dynamic(
  () => import("./profit-chart").then((mod) => mod.ProfitChart),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[250px] items-center justify-center text-sm text-[var(--color-muted-foreground)]">
        Loading chart...
      </div>
    ),
  }
);
